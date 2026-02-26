import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const STORAGE_KEY = 'codesketch-active-room';

// Read synchronously so first render already has the value (no flash)
const getRoomFromStorage = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const { roomId, username } = JSON.parse(stored);
			if (roomId && username) return { roomId, username };
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY);
	}
	return { roomId: null, username: null };
};

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
	const initial = getRoomFromStorage();
	const [activeRoomId, setActiveRoomId] = useState(initial.roomId);
	const [activeUsername, setActiveUsername] = useState(initial.username);

	// Automatically clear room when user signs out
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_OUT') {
				setActiveRoomId(null);
				setActiveUsername(null);
				localStorage.removeItem(STORAGE_KEY);
			}
		});
		return () => subscription.unsubscribe();
	}, []);

	const joinRoom = (roomId, username) => {
		setActiveRoomId(roomId);
		setActiveUsername(username);
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ roomId, username, joinedAt: Date.now() })
		);
	};

	const leaveRoom = () => {
		setActiveRoomId(null);
		setActiveUsername(null);
		localStorage.removeItem(STORAGE_KEY);
	};

	return (
		<RoomContext.Provider
			value={{
				activeRoomId,
				activeUsername,
				isInRoom: !!activeRoomId,
				joinRoom,
				leaveRoom,
			}}
		>
			{children}
		</RoomContext.Provider>
	);
};

export const useRoom = () => {
	const context = useContext(RoomContext);
	if (!context) throw new Error('useRoom must be used within a RoomProvider');
	return context;
};
