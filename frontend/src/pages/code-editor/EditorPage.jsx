import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Hash, LogOut, Menu, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
	Navigate,
	useLocation,
	useNavigate,
	useParams,
} from 'react-router-dom';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { useRoom } from '../../context/RoomContext.jsx';
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
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const { activeRoomId, activeUsername, isInRoom, joinRoom, leaveRoom } =
		useRoom();

	const isValidUUID = (uuid) =>
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			uuid,
		);

	const hasValidRoomId = isValidUUID(roomId);
	const isRefresh = isInRoom && activeRoomId === roomId;
	const username =
		location.state?.username || (isRefresh ? activeUsername : null);
	const hasValidState = !!username;

	useEffect(() => {
		if (!hasValidRoomId || !hasValidState) return;
		let mounted = true;

		const init = async () => {
			let socket;
			try {
				socket = await initSocket();
			} catch (e) {
				if (!mounted) return;
				console.error('Failed to initialize socket:', e);
				leaveRoom();
				toast.error('Authentication failed. Please sign in again.');
				navigate('/');
				return;
			}

			if (!mounted) {
				socket.disconnect();
				return;
			}

			socketRef.current = socket;

			const handleErrors = (e) => {
				console.error('Socket error:', e);
				if (socketRef.current) {
					socketRef.current.off('connect_error', handleErrors);
					socketRef.current.off('connect_failed', handleErrors);
					socketRef.current.disconnect();
					socketRef.current = null;
				}
				leaveRoom();
				toast.error('Socket connection failed, try again later.');
				navigate('/');
			};

			socketRef.current.on('connect_error', handleErrors);
			socketRef.current.on('connect_failed', handleErrors);

			socketRef.current.on('connect', () => {
				socketRef.current.emit(ACTIONS.JOIN, { roomId, username });
				joinRoom(roomId, username);
			});

			socketRef.current.on(
				ACTIONS.JOINED,
				({ clients, username: joinedUser }) => {
					if (joinedUser !== username) {
						toast.success(`${joinedUser} joined the room.`);
					}
					setClients(clients);
				},
			);

			socketRef.current.on(ACTIONS.LEFT, ({ socketId, username: leftUser }) => {
				toast.success(`${leftUser} left the room.`);
				setClients((prev) => prev.filter((c) => c.socketId !== socketId));
			});
		};

		init();

		return () => {
			mounted = false;
			if (socketRef.current) {
				socketRef.current.off(ACTIONS.JOINED);
				socketRef.current.off(ACTIONS.LEFT);
				socketRef.current.off('connect');
				socketRef.current.off('connect_error');
				socketRef.current.off('connect_failed');
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasValidRoomId, hasValidState, roomId, username]);

	async function copyRoomId() {
		try {
			await navigator.clipboard.writeText(roomId);
			toast.success('Room ID copied');
		} catch {
			toast.error('Could not copy the Room ID');
		}
	}

	function handleLeave() {
		leaveRoom();
		navigate('/');
	}

	if (!hasValidRoomId || !hasValidState) {
		return (
			<Navigate
				to="/"
				replace
				state={{ toastMessage: 'Please join rooms from the home page.' }}
			/>
		);
	}

	return (
		<div className="editor-page">
			{/* ── Header ── */}
			<header className="editor-page__header">
				<div className="editor-page__header-left">
					<button
						className="editor-page__menu-btn"
						onClick={() => setSidebarOpen((p) => !p)}
					>
						{sidebarOpen ? <X size={16} /> : <Menu size={16} />}
					</button>
					<span className="editor-page__brand">
						Code<span>Sketch</span>
					</span>
					<span className="editor-page__room-badge">
						<Hash size={12} />
						{roomId.slice(0, 8)}
					</span>
				</div>

				<div className="editor-page__header-right">
					<div className="editor-page__avatars">
						{clients.slice(0, 5).map((c) => (
							<Avatar
								key={c.socketId}
								username={c.username}
								size="sm"
								showStatus
							/>
						))}
						{clients.length > 5 && (
							<span className="editor-page__avatar-overflow">
								+{clients.length - 5}
							</span>
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						iconLeft={<Copy size={14} />}
						onClick={copyRoomId}
					>
						Invite
					</Button>
					<Button
						variant="ghost"
						size="sm"
						iconLeft={<LogOut size={14} />}
						onClick={handleLeave}
					>
						Leave
					</Button>
				</div>
			</header>

			{/* ── Body ── */}
			<div className="editor-page__body">
				{/* Sidebar */}
				<AnimatePresence>
					{sidebarOpen && (
						<motion.aside
							className="editor-page__sidebar"
							initial={{ width: 0, opacity: 0 }}
							animate={{ width: 240, opacity: 1 }}
							exit={{ width: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="editor-page__sidebar-inner">
								<div className="editor-page__sidebar-section">
									<h4>
										<Users size={14} /> Members ({clients.length})
									</h4>
									<ul className="editor-page__members">
										<AnimatePresence>
											{clients.map((c) => (
												<motion.li
													key={c.socketId}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													exit={{ opacity: 0, x: -10 }}
													className="editor-page__member"
												>
													<Avatar username={c.username} size="sm" showStatus />
													<span>{c.username}</span>
													{c.username === username && (
														<span className="editor-page__you-badge">you</span>
													)}
												</motion.li>
											))}
										</AnimatePresence>
									</ul>
								</div>
							</div>
						</motion.aside>
					)}
				</AnimatePresence>

				{/* Main editor area */}
				<main className="editor-page__main">
					<CodeEditor
						socketRef={socketRef}
						roomId={roomId}
						username={username}
						onCodeChange={(code) => {
							codeRef.current = code;
						}}
					/>
				</main>
			</div>
		</div>
	);
};

export default EditorPage;
