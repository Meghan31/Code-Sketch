import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/supabase.js', () => ({
	getSupabase: vi.fn(),
	supabase: null,
}));

vi.mock('../utils/logger.js', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { getSupabase } from '../config/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const makeSocket = (token) => ({
	id: 'socket-test-123',
	handshake: { auth: { token } },
});

describe('verifyAuth middleware', () => {
	let next;

	beforeEach(() => {
		next = vi.fn();
		vi.clearAllMocks();
	});

	it('calls next with an error when no token is provided', async () => {
		const socket = makeSocket(undefined);
		await verifyAuth(socket, next);
		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
		expect(next.mock.calls[0][0].message).toBe('Authentication token required');
	});

	it('calls next with an error when the token is an empty string', async () => {
		const socket = makeSocket('');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe('Authentication token required');
	});

	it('calls next with an error when Supabase is not configured (returns null)', async () => {
		getSupabase.mockReturnValue(null);
		const socket = makeSocket('some-token');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe(
			'Authentication service unavailable',
		);
	});

	it('calls next with an error when the token is invalid / user is null', async () => {
		getSupabase.mockReturnValue({
			auth: {
				getUser: vi
					.fn()
					.mockResolvedValue({
						data: { user: null },
						error: { message: 'Invalid JWT' },
					}),
			},
		});
		const socket = makeSocket('bad-token');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
	});

	it('calls next with an error when Supabase returns an error with no user', async () => {
		getSupabase.mockReturnValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: null },
					error: { message: 'Token expired' },
				}),
			},
		});
		const socket = makeSocket('expired-token');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
	});

	it('attaches user to socket and calls next() with no args on valid token', async () => {
		const mockUser = {
			id: 'user-uuid-1',
			email: 'user@example.com',
			user_metadata: { full_name: 'Test User' },
		};
		getSupabase.mockReturnValue({
			auth: {
				getUser: vi
					.fn()
					.mockResolvedValue({ data: { user: mockUser }, error: null }),
			},
		});
		const socket = makeSocket('valid-jwt-token');
		await verifyAuth(socket, next);

		expect(socket.user).toEqual({
			id: 'user-uuid-1',
			email: 'user@example.com',
			metadata: { full_name: 'Test User' },
		});
		expect(next).toHaveBeenCalledWith();
		expect(next).toHaveBeenCalledOnce();
	});

	it('calls next with "Authentication failed" when getSupabase throws', async () => {
		getSupabase.mockImplementation(() => {
			throw new Error('DB connection failed');
		});
		const socket = makeSocket('any-token');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe('Authentication failed');
	});

	it('calls next with "Authentication failed" when getUser rejects', async () => {
		getSupabase.mockReturnValue({
			auth: {
				getUser: vi.fn().mockRejectedValue(new Error('Network error')),
			},
		});
		const socket = makeSocket('some-token');
		await verifyAuth(socket, next);
		expect(next.mock.calls[0][0].message).toBe('Authentication failed');
	});
});
