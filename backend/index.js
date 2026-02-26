import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import http from 'http';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Server } from 'socket.io';
import { verifyAuth } from './middleware/auth.js';
import { handleSocketError } from './middleware/errorHandler.js';
import { schemas, validate } from './middleware/validation.js';
import { logger } from './utils/logger.js';
import { roomManager } from './utils/roomManager.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',')
	: ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true,
	},
	maxHttpBufferSize: 1e6,
	pingTimeout: 60000,
});

const rateLimiters = {
	join: new RateLimiterMemory({
		points: 10,
		duration: 60,
	}),
	codeChange: new RateLimiterMemory({
		points: 1000,
		duration: 60,
	}),
	languageChange: new RateLimiterMemory({
		points: 20,
		duration: 60,
	}),
	inputChange: new RateLimiterMemory({
		points: 1000,
		duration: 60,
	}),
	executeCode: new RateLimiterMemory({
		points: 10,
		duration: 60,
	}),
};

const getClientIdentifier = (socket) => {
	return (
		socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
		socket.handshake.address ||
		socket.id
	);
};

app.get('/room/:roomId/exists', (req, res) => {
	const { roomId } = req.params;
	const exists = roomManager.roomExists(roomId);
	res.json({ exists });
});

app.get('/health', (req, res) => {
	const stats = roomManager.getStats();
	res.json({
		status: 'healthy',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		rooms: stats.totalRooms,
		clients: stats.totalClients,
		memory: {
			used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
			total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
		},
	});
});

app.get('/metrics', (req, res) => {
	const stats = roomManager.getStats();
	res.set('Content-Type', 'text/plain');
	res.send(
		`
# HELP codesketch_rooms_total Total number of active rooms
# TYPE codesketch_rooms_total gauge
codesketch_rooms_total ${stats.totalRooms}

# HELP codesketch_clients_total Total number of connected clients
# TYPE codesketch_clients_total gauge
codesketch_clients_total ${stats.totalClients}

# HELP codesketch_uptime_seconds Server uptime in seconds
# TYPE codesketch_uptime_seconds counter
codesketch_uptime_seconds ${Math.floor(process.uptime())}
	`.trim()
	);
});

io.use(verifyAuth);

io.on('connection', (socket) => {
	logger.info(`[Socket] Client connected: ${socket.id}`);

	let currentRoom = null;
	let currentUser = null;

	socket.on('join', async (data) => {
		try {
			logger.info(`[Join] Received join request from ${socket.id}:`, data);

			await rateLimiters.join.consume(getClientIdentifier(socket));

			const { roomId, username } = validate(schemas.join, data);
			const sanitizedUsername = username.trim();

			if (currentRoom) {
				logger.info(
					`[Join] User ${socket.id} leaving previous room ${currentRoom}`
				);
				socket.leave(currentRoom);
				const result = roomManager.removeClient(currentRoom, socket.id);
				if (result) {
					io.to(currentRoom).emit('userLeft', {
						socketId: socket.id,
						username: currentUser,
					});
				}
			}

			currentRoom = roomId;
			currentUser = sanitizedUsername;

			logger.info(
				`[Join] User ${sanitizedUsername} (${socket.id}) joining room ${roomId}`
			);
			socket.join(roomId);

			const room = roomManager.addClient(
			roomId,
			socket.id,
			sanitizedUsername,
			socket.user?.id,
			socket.user?.email
		);
			logger.info(`[Join] Room ${roomId} now has ${room.clients.size} clients`);

			const clients = roomManager.getClients(roomId);

			// Broadcast to all users in room that someone joined
			io.to(roomId).emit('userJoined', {
				clients,
				username: sanitizedUsername,
				socketId: socket.id,
			});

			// Send complete state to the newly joined user
			const syncData = {
				code: room.code || '',
				language: room.language || 'cpp',
				stdin: room.stdin || '',
				output: room.output || '',
				isError: room.isError || false,
			};

			logger.info(`[Join] Syncing complete state to ${sanitizedUsername}:`, {
				codeLength: syncData.code.length,
				language: syncData.language,
				stdinLength: syncData.stdin.length,
				outputLength: syncData.output.length,
				isError: syncData.isError,
			});

			// Important: Send to this specific socket only
			socket.emit('syncCode', syncData);

			logger.info(
				`[Join] Successfully synced state to ${sanitizedUsername} in room ${roomId}`
			);
		} catch (error) {
			logger.error(`[Join] Error:`, error);
			handleSocketError(socket, error, 'join');
		}
	});

	socket.on('codeChange', async (data) => {
		try {
			await rateLimiters.codeChange.consume(getClientIdentifier(socket));

			const { roomId, code } = validate(schemas.codeChange, data);

			logger.debug(
				`[CodeChange] Updating code in room ${roomId}, length: ${code.length}`
			);
			roomManager.updateCode(roomId, code);

			// Broadcast to OTHER users only (sender already has the change)
			socket.to(roomId).emit('codeChanged', { code });

			logger.debug(`[CodeChange] Code change broadcasted to room ${roomId}`);
		} catch (error) {
			logger.error(`[CodeChange] Error:`, error);
			handleSocketError(socket, error, 'codeChange');
		}
	});

	socket.on('languageChange', async (data) => {
		try {
			await rateLimiters.languageChange.consume(getClientIdentifier(socket));

			const { roomId, language } = validate(schemas.languageChange, data);

			logger.info(
				`[LanguageChange] Changing language to ${language} in room ${roomId}`
			);
			roomManager.updateLanguage(roomId, language);

			// Broadcast to OTHER users only (sender already has the change)
			socket.to(roomId).emit('languageChanged', { language });

			logger.info(
				`[LanguageChange] Language change broadcasted to room ${roomId}`
			);
		} catch (error) {
			logger.error(`[LanguageChange] Error:`, error);
			handleSocketError(socket, error, 'languageChange');
		}
	});

	// Handle input changes - CRITICAL for syncing
	socket.on('inputChange', async (data) => {
		try {
			logger.debug(`[InputChange] Received from ${socket.id}:`, data);

			await rateLimiters.inputChange.consume(getClientIdentifier(socket));

			const { roomId, stdin } = validate(schemas.inputChange, data);

			logger.info(
				`[InputChange] Updating input in room ${roomId}, length: ${stdin.length}`
			);
			roomManager.updateInput(roomId, stdin);

			// Broadcast to OTHER users only (sender already has the change)
			logger.info(
				`[InputChange] Broadcasting inputChanged to other users in room ${roomId}`
			);
			socket.to(roomId).emit('inputChanged', { stdin });

			logger.info(`[InputChange] Input change broadcasted successfully`);
		} catch (error) {
			logger.error(`[InputChange] Error:`, error);
			handleSocketError(socket, error, 'inputChange');
		}
	});

	// Handle code execution start - broadcast to ALL users including sender
	socket.on('executeCode', async (data) => {
		try {
			logger.info(
				`[ExecuteCode] Received from ${currentUser} (${socket.id}):`,
				{
					roomId: data.roomId,
					language: data.language,
					codeLength: data.code?.length || 0,
					stdinLength: data.stdin?.length || 0,
				}
			);

			await rateLimiters.executeCode.consume(getClientIdentifier(socket));

			const { roomId, code, language, stdin } = validate(
				schemas.executeCode,
				data
			);

			// Broadcast to ALL users in room (including sender)
			logger.info(
				`[ExecuteCode] Broadcasting executionStarted to ALL users in room ${roomId}`
			);
			io.to(roomId).emit('executionStarted', {
				username: currentUser,
			});

			logger.info(
				`[ExecuteCode] Execution started by ${currentUser} in room ${roomId}`
			);
		} catch (error) {
			logger.error(`[ExecuteCode] Error:`, error);
			handleSocketError(socket, error, 'executeCode');
		}
	});

	// Handle execution results - broadcast to ALL users
	socket.on('executionResult', async (data) => {
		try {
			logger.info(
				`[ExecutionResult] Received from ${currentUser} (${socket.id}):`,
				{
					roomId: data.roomId,
					outputLength: data.output?.length || 0,
					isError: data.isError,
				}
			);

			const { roomId, output, isError } = data;

			if (!roomId || output === undefined) {
				throw new Error('Invalid execution result data');
			}

			// Store in room
			logger.info(`[ExecutionResult] Storing output in room ${roomId}`);
			roomManager.updateOutput(roomId, output, isError);

			// Broadcast to ALL users in room (including sender for consistency)
			logger.info(
				`[ExecutionResult] Broadcasting to ALL users in room ${roomId}`
			);
			io.to(roomId).emit('executionResult', {
				output,
				isError,
				username: currentUser,
			});

			logger.info(
				`[ExecutionResult] Successfully broadcasted execution result in room ${roomId}`
			);
		} catch (error) {
			logger.error(`[ExecutionResult] Error:`, error);
			handleSocketError(socket, error, 'executionResult');
		}
	});

	socket.on('disconnect', () => {
		logger.info(`[Disconnect] Client disconnected: ${socket.id}`);

		if (currentRoom) {
			const result = roomManager.removeClient(currentRoom, socket.id);
			if (result) {
				io.to(currentRoom).emit('userLeft', {
					socketId: socket.id,
					username: currentUser,
				});
				logger.info(
					`[Disconnect] User ${currentUser} left room ${currentRoom}`
				);
			}
		}
	});
});

const gracefulShutdown = async (signal) => {
	logger.info(`${signal} received, starting graceful shutdown...`);

	server.close(() => {
		logger.info('HTTP server closed');
	});

	io.close(() => {
		logger.info('Socket.IO server closed');
	});

	await roomManager.shutdown();

	setTimeout(() => {
		logger.error('Forcing shutdown after timeout');
		process.exit(1);
	}, 30000);

	logger.info('Graceful shutdown complete');
	process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
	logger.info(`🚀 Server running on ${host}:${port}`);
	logger.info(`📊 Health check: http://${host}:${port}/health`);
	logger.info(`📈 Metrics: http://${host}:${port}/metrics`);
	logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
