import express from 'express';
import http from 'http';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Server } from 'socket.io';
import { handleSocketError } from './middleware/errorHandler.js';
import { schemas, validate } from './middleware/validation.js';
import { logger } from './utils/logger.js';
import { roomManager } from './utils/roomManager.js';

const app = express();
const server = http.createServer(app);

// ✅ FIXED: Whitelist CORS origins
const allowedOrigins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',')
	: ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true,
	},
	// Connection limits
	maxHttpBufferSize: 1e6, // 1MB
	pingTimeout: 60000,
});

// ✅ FIXED: Separate rate limiters for different operations
const rateLimiters = {
	join: new RateLimiterMemory({
		points: 10, // 10 room joins per minute
		duration: 60,
	}),
	codeChange: new RateLimiterMemory({
		points: 1000, // 1000 code changes per minute (fast typing)
		duration: 60,
	}),
	languageChange: new RateLimiterMemory({
		points: 20, // 20 language switches per minute
		duration: 60,
	}),
	executeCode: new RateLimiterMemory({
		points: 10, // 10 code executions per minute
		duration: 60,
	}),
};

// ✅ FIXED: Helper function to get client identifier (handles proxies)
const getClientIdentifier = (socket) => {
	return (
		socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
		socket.handshake.address ||
		socket.id
	);
};

// ✅ Health check endpoint
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

// ✅ Metrics endpoint for Prometheus
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

// Socket.IO connection handling
io.on('connection', (socket) => {
	logger.info(`Client connected: ${socket.id}`);

	let currentRoom = null;
	let currentUser = null;

	// ✅ FIXED: Join with validation, rate limiting, and error handling
	socket.on('join', async (data) => {
		try {
			// Rate limiting with proper client identifier
			await rateLimiters.join.consume(getClientIdentifier(socket));

			// Validate input
			const { roomId, username } = validate(schemas.join, data);

			// Sanitize username (just trim, Joi pattern already validates)
			const sanitizedUsername = username.trim();

			// Leave current room if in one
			if (currentRoom) {
				socket.leave(currentRoom);
				const result = roomManager.removeClient(currentRoom, socket.id);
				if (result) {
					io.to(currentRoom).emit('userLeft', {
						socketId: socket.id,
						username: currentUser,
					});
				}
			}

			// Join new room
			currentRoom = roomId;
			currentUser = sanitizedUsername;
			socket.join(roomId);

			const room = roomManager.addClient(roomId, socket.id, sanitizedUsername);

			// Send updated client list to all
			const clients = roomManager.getClients(roomId);
			io.to(roomId).emit('userJoined', {
				clients,
				username: sanitizedUsername,
				socketId: socket.id,
			});

			// Sync current state to new user
			socket.emit('syncCode', {
				code: room.code,
				language: room.language,
			});

			logger.info(`User ${sanitizedUsername} joined room ${roomId}`);
		} catch (error) {
			handleSocketError(socket, error, 'join');
		}
	});

	// ✅ FIXED: Code change with proper rate limiting (no sanitization)
	socket.on('codeChange', async (data) => {
		try {
			// Use codeChange rate limiter (allows fast typing)
			await rateLimiters.codeChange.consume(getClientIdentifier(socket));

			const { roomId, code } = validate(schemas.codeChange, data);

			// Don't sanitize code - Monaco Editor handles display safely
			// Sanitization was breaking C++ code with <>, HTML tags, etc.
			roomManager.updateCode(roomId, code);
			socket.to(roomId).emit('codeChanged', { code });
		} catch (error) {
			handleSocketError(socket, error, 'codeChange');
		}
	});

	// ✅ FIXED: Language change with proper rate limiting
	socket.on('languageChange', async (data) => {
		try {
			await rateLimiters.languageChange.consume(getClientIdentifier(socket));

			const { roomId, language } = validate(schemas.languageChange, data);

			roomManager.updateLanguage(roomId, language);
			socket.to(roomId).emit('languageChanged', { language });

			logger.info(`Language changed to ${language} in room ${roomId}`);
		} catch (error) {
			handleSocketError(socket, error, 'languageChange');
		}
	});

	// ✅ FIXED: Execute code with proper rate limiting
	socket.on('executeCode', async (data) => {
		try {
			await rateLimiters.executeCode.consume(getClientIdentifier(socket));

			const { roomId, code, language } = validate(schemas.executeCode, data);

			// Mock execution (will be replaced with real API later)
			setTimeout(() => {
				const mockOutput = `[${language}] Execution complete.\nOutput: Hello, CodeSketch!`;
				io.to(roomId).emit('executionResult', { output: mockOutput });
			}, 1000);

			logger.info(`Code executed in room ${roomId}, language: ${language}`);
		} catch (error) {
			handleSocketError(socket, error, 'executeCode');
		}
	});

	// ✅ Disconnect handling
	socket.on('disconnect', () => {
		if (currentRoom) {
			const result = roomManager.removeClient(currentRoom, socket.id);
			if (result) {
				io.to(currentRoom).emit('userLeft', {
					socketId: socket.id,
					username: currentUser,
				});
			}
		}
		logger.info(`Client disconnected: ${socket.id}`);
	});
});

// ✅ Graceful shutdown
const gracefulShutdown = async (signal) => {
	logger.info(`${signal} received, starting graceful shutdown...`);

	// Stop accepting new connections
	server.close(() => {
		logger.info('HTTP server closed');
	});

	// Close all socket connections gracefully
	io.close(() => {
		logger.info('Socket.IO server closed');
	});

	// Cleanup room manager (clears interval)
	await roomManager.shutdown();

	// Give connections 30 seconds to close
	setTimeout(() => {
		logger.error('Forcing shutdown after timeout');
		process.exit(1);
	}, 30000);

	logger.info('Graceful shutdown complete');
	process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const port = process.env.PORT || 3000;

server.listen(port, () => {
	logger.info(`🚀 Server running on port ${port}`);
	logger.info(`📊 Health check: http://localhost:${port}/health`);
	logger.info(`📈 Metrics: http://localhost:${port}/metrics`);
	logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
