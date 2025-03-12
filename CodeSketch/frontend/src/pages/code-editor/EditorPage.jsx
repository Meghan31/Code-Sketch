import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';
// import { io } from 'socket.io-client';
import Client from '../../components/Clients.jsx';
import CodeEditor from '../../components/CodeEditor';
import './EditorPage.scss';

// const socket = io('http://localhost:3000');

const EditorPage = () => {
	const socketRef = useRef(null);
	const codeRef = useRef(null);
	const location = useLocation();
	const { roomId } = useParams();
	const reactNavigator = useNavigate();
	const [clients] = useState([]);
	// const [language, setLanguage] = useState('cpp');

	// useEffect(() => {
	// 	const init = async () => {
	// 		socketRef.current = await initSocket();
	// 		socketRef.current.on('connect_error', (err) => handleErrors(err));
	// 		socketRef.current.on('connect_failed', (err) => handleErrors(err));

	// 		function handleErrors(e) {
	// 			console.log('socket error', e);
	// 			toast.error('Socket connection failed, try again later.');
	// 			reactNavigator('/');
	// 		}

	// 		socketRef.current.emit(ACTIONS.JOIN, {
	// 			roomId,
	// 			username: location.state?.username,
	// 		});

	// 		// Listening for joined event
	// 		socketRef.current.on(
	// 			ACTIONS.JOINED,
	// 			({ clients, username, socketId }) => {
	// 				// Only show toast for other users joining
	// 				if (username !== location.state?.username) {
	// 					toast.success(`${username} joined the room.`);
	// 					console.log(`${username} joined`);
	// 				}

	// 				// Use a Set to ensure unique clients
	// 				const uniqueClients = Array.from(
	// 					new Set(clients.map((c) => c.socketId))
	// 				).map((socketId) => clients.find((c) => c.socketId === socketId));

	// 				setClients(uniqueClients);

	// 				socketRef.current.emit(ACTIONS.SYNC_CODE, {
	// 					code: codeRef.current,
	// 					socketId,
	// 				});
	// 			}
	// 		);

	// 		// Listening for disconnected
	// 		socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
	// 			toast.success(`${username} left the room.`);
	// 			setClients((prev) =>
	// 				prev.filter((client) => client.socketId !== socketId)
	// 			);
	// 		});
	// 	};

	// 	init();

	// 	return () => {
	// 		if (socketRef.current) {
	// 			socketRef.current.disconnect();
	// 		}
	// 	};
	// }, []);

	async function copyRoomId() {
		try {
			await navigator.clipboard.writeText(roomId);
			toast.success('Room ID has been copied to your clipboard');
		} catch (err) {
			toast.error('Could not copy the Room ID');
			console.error(err);
		}
	}

	function leaveRoom() {
		reactNavigator('/');
	}

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
							<h3>Collaborative Editor</h3>
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
							<button onClick={copyRoomId}>Copy RoomID</button>
							<button onClick={leaveRoom}>Leave</button>
						</div>
					</div>
				</div>
				<div className="rightWrap">
					<p>Welcome to the collaborative editor...</p>
					<CodeEditor
						socketRef={socketRef}
						roomId={roomId}
						onCodeChange={(code) => {
							codeRef.current = code;
						}}
						// language={language}
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
