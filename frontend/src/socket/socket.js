import { io } from 'socket.io-client';
import { supabase } from '../config/supabase';

// Use environment variable or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const initSocket = async () => {
	// Get the current session token
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const token = session?.access_token;

	if (!token) {
		console.error('No authentication token available');
		throw new Error('Authentication required');
	}

	const options = {
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		timeout: 10000,
		transports: ['websocket'],
		autoConnect: true,
		auth: {
			token: token, // Send token for authentication
		},
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
