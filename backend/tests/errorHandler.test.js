import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/logger.js', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import {
	handleSocketError,
	wrapSocketHandler,
} from '../middleware/errorHandler.js';

const makeSocket = () => ({
	id: 'socket-test',
	emit: vi.fn(),
});

describe('handleSocketError', () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
		vi.clearAllMocks();
	});

	it('emits the full error message in development', () => {
		process.env.NODE_ENV = 'development';
		const socket = makeSocket();
		handleSocketError(socket, new Error('Something went wrong'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({
				message: 'Something went wrong',
				event: 'join',
			}),
		);
	});

	it('always includes event name and ISO timestamp', () => {
		const socket = makeSocket();
		handleSocketError(socket, new Error('test'), 'codeChange');
		const payload = socket.emit.mock.calls[0][1];
		expect(payload.event).toBe('codeChange');
		expect(typeof payload.timestamp).toBe('string');
		expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
	});

	it('sanitizes "Invalid room ID format" to a user-friendly message in production', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('Invalid room ID format'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({
				message: 'Invalid room ID. Please check and try again.',
			}),
		);
	});

	it('sanitizes "Room is full" in production', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('Room is full (max 50 clients)'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({ message: 'This room is full. Please try another room.' }),
		);
	});

	it('sanitizes "Maximum number of rooms" in production', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('Maximum number of rooms (1000) reached'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({
				message: 'Server is at capacity. Please try again later.',
			}),
		);
	});

	it('returns rate-limit message in production for "Too Many Requests"', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('Too Many Requests'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({
				message: 'You are sending requests too quickly. Please slow down.',
			}),
		);
	});

	it('returns rate-limit message in production for "rate limit" error', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('rate limit exceeded'), 'codeChange');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({
				message: 'You are sending requests too quickly. Please slow down.',
			}),
		);
	});

	it('falls back to generic message in production for unknown errors', () => {
		process.env.NODE_ENV = 'production';
		const socket = makeSocket();
		handleSocketError(socket, new Error('some internal detail'), 'join');
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({ message: 'An error occurred. Please try again.' }),
		);
	});

	it('emits only once per call', () => {
		const socket = makeSocket();
		handleSocketError(socket, new Error('test'), 'join');
		expect(socket.emit).toHaveBeenCalledOnce();
	});
});

describe('wrapSocketHandler', () => {
	it('calls the wrapped handler with the provided socket and data', async () => {
		const handler = vi.fn().mockResolvedValue(undefined);
		const wrapped = wrapSocketHandler(handler);
		const socket = makeSocket();
		const data = { roomId: 'abc', code: 'test' };
		await wrapped(socket, data);
		expect(handler).toHaveBeenCalledWith(socket, data);
	});

	it('emits an error event when the handler throws synchronously', async () => {
		const socket = makeSocket();
		const handler = vi.fn().mockRejectedValue(new Error('handler boom'));
		const wrapped = wrapSocketHandler(handler);
		await wrapped(socket, {});
		expect(socket.emit).toHaveBeenCalledWith(
			'error',
			expect.objectContaining({ event: 'unknown' }),
		);
	});

	it('does not throw when the handler rejects', async () => {
		const socket = makeSocket();
		const handler = vi.fn().mockRejectedValue(new Error('silent fail'));
		const wrapped = wrapSocketHandler(handler);
		await expect(wrapped(socket, {})).resolves.toBeUndefined();
	});
});
