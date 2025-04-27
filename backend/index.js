import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: '*',
	},
});

// Store rooms and their clients/code
const rooms = new Map();

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	let currentRoom = null;
	let currentUser = null;

	// Handle room joining
	socket.on('join', ({ roomId, username }) => {
		// Leave current room if already in one
		if (currentRoom) {
			socket.leave(currentRoom);
			const roomClients = rooms.get(currentRoom)?.clients || new Set();
			roomClients.delete(socket.id);
			io.to(currentRoom).emit('userLeft', {
				socketId: socket.id,
				username: currentUser,
			});
		}

		currentRoom = roomId;
		currentUser = username;

		socket.join(currentRoom);

		// Initialize room if it doesn't exist
		if (!rooms.has(currentRoom)) {
			rooms.set(currentRoom, {
				clients: new Map(),
				code: '',
				language: 'cpp',
			});
		}

		// Add user to room
		const room = rooms.get(currentRoom);
		room.clients.set(socket.id, username);

		// Inform all clients in the room (including the new one) about all users
		const clients = Array.from(room.clients, ([id, name]) => ({
			socketId: id,
			username: name,
		}));

		io.to(currentRoom).emit('userJoined', {
			clients,
			username: currentUser,
			socketId: socket.id,
		});

		// Send current code to the new user
		socket.emit('syncCode', {
			code: room.code,
			language: room.language,
		});

		console.log('User', username, 'joined room', roomId);
	});

	// Handle code changes
	socket.on('codeChange', ({ roomId, code }) => {
		if (rooms.has(roomId)) {
			rooms.get(roomId).code = code;
			// Broadcast to everyone except sender
			socket.to(roomId).emit('codeChanged', { code });
		}
	});

	// Handle language changes
	socket.on('languageChange', ({ roomId, language }) => {
		if (rooms.has(roomId)) {
			rooms.get(roomId).language = language;
			// Broadcast to everyone except sender
			socket.to(roomId).emit('languageChanged', { language });
		}
	});

	// Handle code execution (placeholder)
	socket.on('executeCode', ({ roomId, code, language }) => {
		// For now, just mock an execution response
		// In a real app, you'd integrate with a code execution API
		setTimeout(() => {
			const mockOutput = `[${language}] Execution complete.\nOutput: Hello, CodeSketch!`;
			io.to(roomId).emit('executionResult', { output: mockOutput });
		}, 1000);
	});

	// Handle disconnections
	socket.on('disconnect', () => {
		if (currentRoom && rooms.has(currentRoom)) {
			const room = rooms.get(currentRoom);
			room.clients.delete(socket.id);

			// If room is empty, remove it
			if (room.clients.size === 0) {
				rooms.delete(currentRoom);
				console.log('Room', currentRoom, "deleted because it's empty");
			} else {
				// Notify others that user has left
				io.to(currentRoom).emit('userLeft', {
					socketId: socket.id,
					username: currentUser,
				});
			}
		}
		console.log('User disconnected:', socket.id);
	});
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
