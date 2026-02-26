import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { v4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';
import './Home.scss';

const Home = () => {
	const navigate = useNavigate();
	const { user, signOut } = useAuth();
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState(
		user?.user_metadata?.full_name || user?.email || ''
	);
	const [isJoining, setIsJoining] = useState(false);

	// Clear active room data when coming to home page
	// This prevents duplicate connections and redirect loops
	useEffect(() => {
		// Disconnect any existing socket connection
		if (window.__codeSketchSocket) {
			console.log('Disconnecting existing socket from home page');
			window.__codeSketchSocket.disconnect();
			window.__codeSketchSocket = null;
			window.__codeSketchRoomId = null;
		}

		// Clear active room from localStorage when user visits home page
		// This ensures clean state for new room joins
		localStorage.removeItem('activeRoom');
		localStorage.removeItem('activeUsername');
	}, []);

	// UUID validation helper
	const isValidUUID = (uuid) => {
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	};

	// Create a new room with UUID
	const createRoom = (e) => {
		e.preventDefault();

		// Validate username before creating
		if (!username || username.trim().length < 2) {
			toast.error('Please enter your name (at least 2 characters)');
			return;
		}

		const id = v4();
		const trimmedUsername = username.trim();

		// Try to copy to clipboard
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('Room ID created and copied to clipboard');
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
				toast.error('Room ID created but could not copy to clipboard');
			});

		// Navigate to the new room immediately
		navigate(`/editor/${id}`, {
			state: {
				username: trimmedUsername,
			},
		});
	};

	// Join an existing room
	const joinRoom = async () => {
		// Validate inputs
		if (!roomId || !username) {
			toast.error('Room ID & username are required');
			return;
		}

		// Trim whitespace
		const trimmedRoomId = roomId.trim();
		const trimmedUsername = username.trim();

		// Check if roomId is valid UUID
		if (!isValidUUID(trimmedRoomId)) {
			toast.error(
				'Invalid Room ID format. Please use a valid room ID or create a new room.'
			);
			return;
		}

		// Validate username
		if (trimmedUsername.length < 2) {
			toast.error('Username must be at least 2 characters');
			return;
		}

		if (trimmedUsername.length > 30) {
			toast.error('Username cannot exceed 30 characters');
			return;
		}

		// Check username pattern (alphanumeric, spaces, underscores only)
		const usernameRegex = /^[a-zA-Z0-9_\s]+$/;
		if (!usernameRegex.test(trimmedUsername)) {
			toast.error(
				'Username can only contain letters, numbers, spaces, and underscores'
			);
			return;
		}

		// Prevent multiple join attempts
		if (isJoining) return;

		setIsJoining(true);

		try {
			// Check if room exists on the server
			const BACKEND_URL =
				import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
			const response = await fetch(
				`${BACKEND_URL}/room/${trimmedRoomId}/exists`
			);

			if (!response.ok) {
				throw new Error('Failed to validate room');
			}

			const data = await response.json();

			if (!data.exists) {
				toast.error(
					'Room does not exist. Please check the Room ID or create a new room.'
				);
				setIsJoining(false);
				return;
			}

			// Navigate to editor page if room exists
			navigate(`/editor/${trimmedRoomId}`, {
				state: {
					username: trimmedUsername,
				},
			});
		} catch (error) {
			console.error('Error validating room:', error);
			toast.error('Failed to validate room. Please try again.');
			setIsJoining(false);
		}
	};

	// Handle Enter key press
	const handleInputEnter = (e) => {
		if (e.code === 'Enter') {
			joinRoom();
		}
	};

	// Handle logout
	const handleLogout = async () => {
		// Clear active room on logout
		localStorage.removeItem('activeRoom');
		localStorage.removeItem('activeUsername');
		await signOut();
	};

	return (
		<div className="homePageWrapper">
			<div className="userInfoBar">
				<div className="userInfo">
					{user?.user_metadata?.avatar_url && (
						<img
							src={user.user_metadata.avatar_url}
							alt="Profile"
							className="userAvatar"
						/>
					)}
					<span className="userEmail">{user?.email}</span>
				</div>
				<button className="logoutBtn" onClick={handleLogout}>
					Sign Out
				</button>
			</div>
			<div className="formWrapper">
				<h1>CodeSketch</h1>
				<p>Real-time collaborative code editor</p>
				<div className="form">
					<div className="inputWrapper">
						<label>Your Name</label>
						<input
							type="text"
							placeholder="Enter Your Name"
							onChange={(e) => setUsername(e.target.value)}
							value={username}
							onKeyUp={handleInputEnter}
							disabled={isJoining}
						/>
					</div>
					<div className="inputWrapper">
						<label>Room ID</label>
						<input
							type="text"
							placeholder="Enter Room ID"
							onChange={(e) => setRoomId(e.target.value)}
							value={roomId}
							onKeyUp={handleInputEnter}
							disabled={isJoining}
						/>
					</div>

					<button onClick={joinRoom} disabled={isJoining}>
						{isJoining ? 'Connecting...' : 'Join Room'}
					</button>
				</div>
				<div className="createRoom">
					<p>
						Don&apos;t have a room ID?{' '}
						<a
							onClick={createRoom}
							style={{
								color: 'whitesmoke',
								borderBottom: '0.1px solid grey',
								cursor: 'pointer',
							}}
						>
							Create a new room
						</a>
					</p>
				</div>
			</div>
			<div className="footer">
				<p style={{ color: 'whitesmoke' }}>
					Developed by{'   '}
					<a
						href="https://www.meghan31.me"
						target="_blank"
						rel="noreferrer"
						style={{
							color: 'grey',
							fontWeight: 'bolder',
							fontSize: '1.2rem',
						}}
					>
						Meghan31
					</a>
				</p>
			</div>
		</div>
	);
};

export default Home;
