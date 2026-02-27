import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// Mock supabase — resolved relative to this file (src/context/ → src/config/supabase)
vi.mock('../config/supabase', () => {
	const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
	const mockSignOut = vi.fn().mockResolvedValue({ error: null });
	const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
	let authStateCallback = null;
	const mockOnAuthStateChange = vi.fn().mockImplementation((cb) => {
		authStateCallback = cb;
		return { data: { subscription: { unsubscribe: vi.fn() } } };
	});

	return {
		supabase: {
			auth: {
				getSession: mockGetSession,
				onAuthStateChange: mockOnAuthStateChange,
				signInWithOAuth: mockSignInWithOAuth,
				signOut: mockSignOut,
			},
			_triggerAuthChange: (event, session) => {
				if (authStateCallback) authStateCallback(event, session);
			},
		},
	};
});

import { supabase } from '../config/supabase';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthProvider / useAuth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
		supabase.auth.onAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } },
		});
	});

	it('throws when useAuth is called outside of AuthProvider', () => {
		expect(() => renderHook(() => useAuth())).toThrow(
			'useAuth must be used within an AuthProvider',
		);
	});

	it('starts in the loading state', () => {
		// Never resolve getSession so loading stays true
		supabase.auth.getSession.mockReturnValue(new Promise(() => {}));
		const { result } = renderHook(() => useAuth(), { wrapper });
		expect(result.current.loading).toBe(true);
	});

	it('provides null user when there is no session', async () => {
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		expect(result.current.user).toBeNull();
		expect(result.current.loading).toBe(false);
	});

	it('sets user from session returned by getSession', async () => {
		const mockUser = { id: 'u1', email: 'test@example.com' };
		supabase.auth.getSession.mockResolvedValue({
			data: { session: { user: mockUser } },
		});
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		expect(result.current.user).toEqual(mockUser);
	});

	it('updates user when onAuthStateChange fires a SIGNED_IN event', async () => {
		let capturedCallback;
		supabase.auth.onAuthStateChange.mockImplementation((cb) => {
			capturedCallback = cb;
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		});

		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});

		const newUser = { id: 'u2', email: 'new@example.com' };
		act(() => {
			capturedCallback('SIGNED_IN', { user: newUser });
		});

		expect(result.current.user).toEqual(newUser);
	});

	it('clears user when onAuthStateChange fires a SIGNED_OUT event', async () => {
		const mockUser = { id: 'u1', email: 'test@example.com' };
		supabase.auth.getSession.mockResolvedValue({
			data: { session: { user: mockUser } },
		});
		let capturedCallback;
		supabase.auth.onAuthStateChange.mockImplementation((cb) => {
			capturedCallback = cb;
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		});

		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		expect(result.current.user).toEqual(mockUser);

		act(() => {
			capturedCallback('SIGNED_OUT', null);
		});

		expect(result.current.user).toBeNull();
	});

	it('calls supabase.auth.signInWithOAuth on signInWithGoogle', async () => {
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		await act(async () => {
			await result.current.signInWithGoogle();
		});
		expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
			expect.objectContaining({ provider: 'google' }),
		);
	});

	it('sets error when signInWithGoogle fails', async () => {
		supabase.auth.signInWithOAuth.mockResolvedValue({
			error: { message: 'OAuth failed' },
		});
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		await act(async () => {
			await result.current.signInWithGoogle();
		});
		expect(result.current.error).toBe('OAuth failed');
	});

	it('calls supabase.auth.signOut on signOut', async () => {
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		await act(async () => {
			await result.current.signOut();
		});
		expect(supabase.auth.signOut).toHaveBeenCalledOnce();
	});

	it('unsubscribes from auth state changes on unmount', async () => {
		const unsubscribe = vi.fn();
		supabase.auth.onAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe } },
		});
		const { unmount } = renderHook(() => useAuth(), { wrapper });
		await act(async () => {});
		unmount();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});
});
