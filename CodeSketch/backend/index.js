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

const rooms = new Map();

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	let currentRoom = null;
	let currentUser = null;
	socket.on('join', ({ roomId, username }) => {
		if (currentRoom) {
			socket.leave(currentRoom);
			rooms.get(currentRoom).delete(socket.id);
			io.to(currentRoom).emit('userJoined', Array.from(rooms.get(currentRoom)));
		}
		currentRoom = roomId;
		currentUser = username;

		socket.join(currentRoom);
		if (!rooms.has(currentRoom)) {
			rooms.set(currentRoom, new Set());
		}

		rooms.get(currentRoom).add(username);
		io.to(currentRoom).emit('userJoined', Array.from(rooms.get(currentRoom)));
		console.log('User', username, 'joined room', roomId);
	});
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
