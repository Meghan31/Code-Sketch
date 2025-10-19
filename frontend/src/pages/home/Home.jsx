import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { v4 } from 'uuid';
import { initSocket } from '../../socket/socket.js';
import './Home.scss';

const Home = () => {
	const navigate = useNavigate();
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState('');
	const [isJoining, setIsJoining] = useState(false);

	// UUID validation helper
	const isValidUUID = (uuid) => {
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	};

	// Create a new room with UUID
	const createRoom = (e) => {
		e.preventDefault();
		const id = v4();
		setRoomId(id);

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

		let socket = null;

		try {
			// Try to initialize a socket connection to verify server is reachable
			socket = initSocket();

			// Wait for connection or timeout after 5 seconds
			const connectionPromise = new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Connection timeout'));
				}, 5000);

				socket.on('connect', () => {
					clearTimeout(timeout);
					resolve();
				});

				socket.on('connect_error', (error) => {
					clearTimeout(timeout);
					reject(error);
				});

				socket.on('connect_timeout', () => {
					clearTimeout(timeout);
					reject(new Error('Connection timeout'));
				});
			});

			await connectionPromise;

			// If we reach here, connection was successful
			// Navigate to editor page
			navigate(`/editor/${trimmedRoomId}`, {
				state: {
					username: trimmedUsername,
				},
			});
		} catch (error) {
			console.error('Connection error:', error);
			toast.error('Could not connect to server. Please try again later.');
		} finally {
			// ALWAYS disconnect and cleanup the test socket
			if (socket) {
				socket.removeAllListeners();
				socket.disconnect();
			}
			setIsJoining(false);
		}
	};

	// Handle Enter key press
	const handleInputEnter = (e) => {
		if (e.code === 'Enter') {
			joinRoom();
		}
	};

	return (
		<div className="homePageWrapper">
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
