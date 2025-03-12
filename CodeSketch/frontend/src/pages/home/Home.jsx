import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { v4 } from 'uuid';
import './Home.scss';

const socket = io('http://localhost:3000');

const Home = () => {
	const navigate = useNavigate();
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState('');

	// Create Room
	const createRoom = (e) => {
		e.preventDefault();
		const id = v4();
		setRoomId(id);
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('Room ID created and copied to clipboard');
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
			});
		console.log(`Created room with ID: ${id}`);
	};

	// Join Room
	const joinRoom = () => {
		if (!roomId || !username) {
			toast.error('ROOM ID & username is required');
			return;
		}
		socket.emit('join', { roomId, username });

		// Redirect
		navigate(`/editor/${roomId}`, {
			state: {
				username,
			},
		});
	};

	const handleInputEnter = (e) => {
		if (e.code === 'Enter') {
			joinRoom();
		}
	};

	return (
		<div className="homePageWrapper">
			<div className="formWrapper">
				<h1>CodeSketch</h1>
				<p>Enter a room ID to start collaborating with your friends</p>
				<div className="form">
					<div className="inputWrapper">
						<label>Your Name</label>

						<input
							type="text"
							placeholder="Enter Your Name"
							onChange={(e) => setUsername(e.target.value)}
							value={username}
							onKeyUp={handleInputEnter}
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
						/>
					</div>

					<button onClick={joinRoom}>Join Room</button>
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
