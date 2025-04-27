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
		console.log(`Created room with ID: ${id}`);
	};

	// Join an existing room
	const joinRoom = async () => {
		// Validate inputs
		if (!roomId || !username) {
			toast.error('Room ID & username are required');
			return;
		}

		// Prevent multiple join attempts
		if (isJoining) return;

		setIsJoining(true);

		try {
			// Try to initialize a socket connection to verify server is reachable
			const socket = initSocket();

			// Wait for connection or timeout after 3 seconds
			const connectionPromise = new Promise((resolve, reject) => {
				socket.on('connect', resolve);
				socket.on('connect_error', reject);
				socket.on('connect_timeout', reject);

				// Timeout after 3 seconds
				setTimeout(() => reject(new Error('Connection timeout')), 3000);
			});

			await connectionPromise;

			// If we reach here, connection was successful
			socket.disconnect(); // Disconnect this test socket, we'll reconnect in EditorPage

			// Redirect to editor page
			navigate(`/editor/${roomId}`, {
				state: {
					username,
				},
			});
		} catch (error) {
			console.error('Connection error:', error);
			toast.error('Could not connect to server. Please try again later.');
		} finally {
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
						Don&apos;t have a room ID?{' Click here  '}
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
						href="https://www.meghan31.live"
						target="_blank"
						rel="noreferrer"
						style={{ color: 'grey', fontWeight: 'bolder', fontSize: '1.2rem' }}
					>
						Meghan31
					</a>
				</p>
			</div>
		</div>
	);
};

export default Home;
