// import { io } from 'socket.io-client';

// // Initialize socket connection
// export const initSocket = () => {
// 	const options = {
// 		'force new connection': true,
// 		reconnectionAttempts: 5,
// 		timeout: 10000,
// 		transports: ['websocket'],
// 	};

// 	return io('http://localhost:3000', options);
// };

import { io } from 'socket.io-client';

// Use environment variable or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const initSocket = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		timeout: 10000,
		transports: ['websocket'],
		autoConnect: true,
	};

	try {
		const socket = io(SOCKET_URL, options);

		// Add error logging for debugging
		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error.message);
		});

		socket.on('reconnect_attempt', (attemptNumber) => {
			console.log(`Reconnection attempt ${attemptNumber}`);
		});

		socket.on('reconnect_failed', () => {
			console.error('Socket reconnection failed after maximum attempts');
		});

		return socket;
	} catch (error) {
		console.error('Failed to initialize socket:', error);
		throw error;
	}
};
