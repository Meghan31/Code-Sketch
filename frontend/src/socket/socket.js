import { io } from 'socket.io-client';

// Initialize socket connection
export const initSocket = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempts: 5,
		timeout: 10000,
		transports: ['websocket'],
	};

	return io('http://localhost:3000', options);
};
