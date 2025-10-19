import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
	Navigate,
	useLocation,
	useNavigate,
	useParams,
} from 'react-router-dom';
import Client from '../../components/client-circle/Clients.jsx';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import ACTIONS from '../../socket/actions.js';
import { initSocket } from '../../socket/socket.js';
import './EditorPage.scss';

const EditorPage = () => {
	const socketRef = useRef(null);
	const codeRef = useRef(null);
	const location = useLocation();
	const { roomId } = useParams();
	const navigate = useNavigate();
	const [clients, setClients] = useState([]);

	// UUID validation helper
	const isValidUUID = (uuid) => {
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	};

	// Validate before running hooks
	const username = location.state?.username;
	const hasValidState = !!username;
	const hasValidRoomId = isValidUUID(roomId);

	useEffect(() => {
		// Only run if validation passes
		if (!hasValidRoomId || !hasValidState) {
			return;
		}

		const init = async () => {
			// Initialize socket connection
			socketRef.current = initSocket();

			// Define error handler
			const handleErrors = (e) => {
				console.error('Socket error:', e);
				toast.error('Socket connection failed, try again later.');
				navigate('/');
			};

			// Register error listeners
			socketRef.current.on('connect_error', handleErrors);
			socketRef.current.on('connect_failed', handleErrors);

			// Join the room
			socketRef.current.emit(ACTIONS.JOIN, {
				roomId,
				username: username,
			});

			// Handle user joined event
			const handleUserJoined = ({ clients, username: joinedUser }) => {
				// Only show toast for other users joining
				if (joinedUser !== username) {
					toast.success(`${joinedUser} joined the room.`);
				}
				setClients(clients);
			};

			// Handle user left event
			const handleUserLeft = ({ socketId, username: leftUser }) => {
				toast.success(`${leftUser} left the room.`);
				setClients((prev) =>
					prev.filter((client) => client.socketId !== socketId)
				);
			};

			socketRef.current.on(ACTIONS.JOINED, handleUserJoined);
			socketRef.current.on(ACTIONS.LEFT, handleUserLeft);
		};

		init();

		// Cleanup function
		return () => {
			if (socketRef.current) {
				socketRef.current.off(ACTIONS.JOINED);
				socketRef.current.off(ACTIONS.LEFT);
				socketRef.current.off('connect_error');
				socketRef.current.off('connect_failed');
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
	}, [hasValidRoomId, hasValidState, roomId, username, navigate]);

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
		navigate('/');
	}

	// Validation check - redirect if invalid
	if (!hasValidRoomId || !hasValidState) {
		return <Navigate to="/" replace />;
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
							<div className="footer">
								<p>
									Developed by{' '}
									<a
										href="https://meghan31.me"
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
		</div>
	);
};

export default EditorPage;
