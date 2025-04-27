import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';
import Client from '../../components/Clients.jsx';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import ACTIONS from '../../socket/actions.js';
import { initSocket } from '../../socket/socket.js';
import './EditorPage.scss';

const EditorPage = () => {
	const socketRef = useRef(null);
	const codeRef = useRef(null);
	const location = useLocation();
	const { roomId } = useParams();
	const reactNavigator = useNavigate();
	const [clients, setClients] = useState([]);

	useEffect(() => {
		const init = async () => {
			// Initialize socket connection
			socketRef.current = initSocket();

			// Handle socket connection errors
			socketRef.current.on('connect_error', (err) => handleErrors(err));
			socketRef.current.on('connect_failed', (err) => handleErrors(err));

			function handleErrors(e) {
				console.log('socket error', e);
				toast.error('Socket connection failed, try again later.');
				reactNavigator('/');
			}

			// Join the room
			socketRef.current.emit(ACTIONS.JOIN, {
				roomId,
				username: location.state?.username,
			});

			// Handle user joined event
			socketRef.current.on(
				ACTIONS.JOINED,
				({ clients, username, socketId }) => {
					// Only show toast for other users joining
					if (username !== location.state?.username) {
						toast.success(`${username} joined the room.`);
						console.log(`${username} joined`);
						console.log(socketId);
					}

					setClients(clients);
				}
			);

			// Handle user left event
			socketRef.current.on(ACTIONS.LEFT, ({ socketId, username }) => {
				toast.success(`${username} left the room.`);
				setClients((prev) =>
					prev.filter((client) => client.socketId !== socketId)
				);
			});
		};

		init();

		// Clean up on component unmount
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current.off(ACTIONS.JOINED);
				socketRef.current.off(ACTIONS.LEFT);
			}
		};
	}, [location.state?.username, reactNavigator, roomId]);

	// Copy room ID to clipboard
	async function copyRoomId() {
		try {
			await navigator.clipboard.writeText(roomId);
			toast.success('Room ID has been copied to your clipboard');
		} catch (err) {
			toast.error('Could not copy the Room ID');
			console.error(err);
		}
	}

	// Leave the room and navigate to home
	function leaveRoom() {
		reactNavigator('/');
	}

	// If no location state (direct URL access), redirect to home
	if (!location.state) {
		return <Navigate to="/" />;
	}

	return (
		<div className="editorPage">
			<div className="mainWrap">
				<div className="leftWrap">
					<div className="lefttopWrap">
						<div className="logo">
							<img
								src="https://img.icons8.com/ios/452/code.png"
								alt="code"
								height={30}
								width={30}
							/>
							<h3>CodeSketch</h3>
						</div>
						<p>____________________________</p>
						<div className="clientsList">
							{clients.map((client) => (
								<Client key={client.socketId} username={client.username} />
							))}
						</div>
					</div>
					<div className="leftbottomWrap">
						<div className="buttons">
							<button onClick={copyRoomId}>Copy Room ID</button>
							<button onClick={leaveRoom}>Leave</button>
						</div>
					</div>
				</div>
				<div className="rightWrap">
					<p>
						Welcome to the collaborative editor. Write, run, and collaborate in
						real-time!
					</p>
					<CodeEditor
						socketRef={socketRef}
						roomId={roomId}
						onCodeChange={(code) => {
							codeRef.current = code;
						}}
					/>
				</div>
			</div>
			<div className="footer">
				<p>
					Developed by{' '}
					<a
						href="https://meghan31.live"
						target="_blank"
						rel="noreferrer"
						style={{
							color: 'black',
							fontWeight: 'bold',
							textDecoration: 'none',
						}}
					>
						Meghan31
					</a>
				</p>
			</div>
		</div>
	);
};

export default EditorPage;
