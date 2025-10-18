import { logger } from '../utils/logger.js';

export const handleSocketError = (socket, error, event) => {
	logger.error(`Socket error in ${event}:`, {
		error: error.message,
		stack: error.stack,
		socketId: socket.id,
		event,
	});

	// ← ADDED: Sanitize error messages in production
	const isProduction = process.env.NODE_ENV === 'production';
	const userMessage = isProduction
		? getSafeErrorMessage(error)
		: error.message || 'An error occurred';

	// Send user-friendly error to client
	socket.emit('error', {
		message: userMessage,
		event,
		timestamp: new Date().toISOString(),
	});
};

// ← ADDED: Helper to provide safe error messages
const getSafeErrorMessage = (error) => {
	const message = error.message || '';

	// Known safe error messages
	const safeErrors = {
		'Invalid room ID format': 'Invalid room ID. Please check and try again.',
		'Room ID is required': 'Room ID is required.',
		'Username is required': 'Username is required.',
		'Username must be at least 2 characters':
			'Username must be at least 2 characters.',
		'Username cannot exceed 30 characters': 'Username is too long.',
		'Invalid programming language': 'Invalid programming language selected.',
		'Code cannot exceed 100KB': 'Code is too large.',
		'Maximum number of rooms': 'Server is at capacity. Please try again later.',
		'Room is full': 'This room is full. Please try another room.',
	};

	// Check if it's a known safe error
	for (const [key, safeMsg] of Object.entries(safeErrors)) {
		if (message.includes(key)) {
			return safeMsg;
		}
	}

	// Rate limit errors
	if (message.includes('Too Many Requests') || message.includes('rate limit')) {
		return 'You are sending requests too quickly. Please slow down.';
	}

	// Generic fallback for production
	return 'An error occurred. Please try again.';
};

export const wrapSocketHandler = (handler) => {
	return async (socket, data) => {
		try {
			await handler(socket, data);
		} catch (error) {
			handleSocketError(socket, error, 'unknown');
		}
	};
};
