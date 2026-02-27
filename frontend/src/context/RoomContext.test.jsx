import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomProvider, useRoom } from './RoomContext';

vi.mock('../config/supabase', () => {
	let authStateCallback = null;
	return {
		supabase: {
			auth: {
				onAuthStateChange: vi.fn().mockImplementation((cb) => {
					authStateCallback = cb;
					return { data: { subscription: { unsubscribe: vi.fn() } } };
				}),
			},
			_triggerAuthChange: (event) => {
				if (authStateCallback) authStateCallback(event, null);
			},
		},
	};
});

import { supabase } from '../config/supabase';

const STORAGE_KEY = 'codesketch-active-room';
const wrapper = ({ children }) => <RoomProvider>{children}</RoomProvider>;

describe('RoomProvider / useRoom', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		supabase.auth.onAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } },
		});
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('throws when useRoom is called outside of RoomProvider', () => {
		expect(() => renderHook(() => useRoom())).toThrow(
			'useRoom must be used within a RoomProvider',
		);
	});

	it('starts with no active room', () => {
		const { result } = renderHook(() => useRoom(), { wrapper });
		expect(result.current.activeRoomId).toBeNull();
		expect(result.current.activeUsername).toBeNull();
		expect(result.current.isInRoom).toBe(false);
	});

	it('reads persisted room state from localStorage on mount', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ roomId: 'room-abc', username: 'alice', joinedAt: 1 }),
		);
		const { result } = renderHook(() => useRoom(), { wrapper });
		expect(result.current.activeRoomId).toBe('room-abc');
		expect(result.current.activeUsername).toBe('alice');
		expect(result.current.isInRoom).toBe(true);
	});

	it('handles corrupted localStorage gracefully', () => {
		localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
		const { result } = renderHook(() => useRoom(), { wrapper });
		expect(result.current.activeRoomId).toBeNull();
	});

	it('joinRoom sets activeRoomId, activeUsername, and isInRoom', () => {
		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-xyz', 'bob');
		});
		expect(result.current.activeRoomId).toBe('room-xyz');
		expect(result.current.activeUsername).toBe('bob');
		expect(result.current.isInRoom).toBe(true);
	});

	it('joinRoom persists to localStorage', () => {
		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-xyz', 'bob');
		});
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
		expect(stored.roomId).toBe('room-xyz');
		expect(stored.username).toBe('bob');
	});

	it('leaveRoom clears activeRoomId and activeUsername', () => {
		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-xyz', 'bob');
		});
		act(() => {
			result.current.leaveRoom();
		});
		expect(result.current.activeRoomId).toBeNull();
		expect(result.current.activeUsername).toBeNull();
		expect(result.current.isInRoom).toBe(false);
	});

	it('leaveRoom removes the key from localStorage', () => {
		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-xyz', 'bob');
		});
		act(() => {
			result.current.leaveRoom();
		});
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('clears room state on SIGNED_OUT auth event', async () => {
		let capturedCallback;
		supabase.auth.onAuthStateChange.mockImplementation((cb) => {
			capturedCallback = cb;
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		});

		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-abc', 'carol');
		});
		expect(result.current.isInRoom).toBe(true);

		act(() => {
			capturedCallback('SIGNED_OUT', null);
		});

		expect(result.current.activeRoomId).toBeNull();
		expect(result.current.activeUsername).toBeNull();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('does not clear room on non-SIGNED_OUT auth events', () => {
		let capturedCallback;
		supabase.auth.onAuthStateChange.mockImplementation((cb) => {
			capturedCallback = cb;
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		});

		const { result } = renderHook(() => useRoom(), { wrapper });
		act(() => {
			result.current.joinRoom('room-abc', 'carol');
		});

		act(() => {
			capturedCallback('TOKEN_REFRESHED', { user: {} });
		});

		expect(result.current.activeRoomId).toBe('room-abc');
	});

	it('unsubscribes from auth state changes on unmount', () => {
		const unsubscribe = vi.fn();
		supabase.auth.onAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe } },
		});
		const { unmount } = renderHook(() => useRoom(), { wrapper });
		unmount();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});
});
