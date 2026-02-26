import { motion } from 'framer-motion';
import { ArrowRight, Copy, LogOut, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 } from 'uuid';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import './Home.scss';

const Home = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, signOut } = useAuth();
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState(
		user?.user_metadata?.full_name || user?.email || '',
	);
	const [isJoining, setIsJoining] = useState(false);

	useEffect(() => {
		if (location.state?.toastMessage) {
			toast.error(location.state.toastMessage);
		}
	}, []);

	const isValidUUID = (uuid) => {
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	};

	const generateRoomId = () => {
		const id = v4();
		setRoomId(id);
		navigator.clipboard
			.writeText(id)
			.then(() => toast.success('Room ID copied to clipboard'))
			.catch(() => {});
	};

	const createRoom = (e) => {
		e.preventDefault();
		if (!username || username.trim().length < 2) {
			toast.error('Please enter your name (at least 2 characters)');
			return;
		}
		const id = v4();
		const trimmedUsername = username.trim();
		navigator.clipboard
			.writeText(id)
			.then(() => toast.success('Room ID created & copied'))
			.catch(() => {});
		navigate(`/editor/${id}`, { state: { username: trimmedUsername } });
	};

	const joinRoom = async () => {
		if (!roomId || !username) {
			toast.error('Room ID & username are required');
			return;
		}
		const trimmedRoomId = roomId.trim();
		const trimmedUsername = username.trim();
		if (!isValidUUID(trimmedRoomId)) {
			toast.error('Invalid Room ID format');
			return;
		}
		if (trimmedUsername.length < 2) {
			toast.error('Username must be at least 2 characters');
			return;
		}
		if (trimmedUsername.length > 30) {
			toast.error('Username cannot exceed 30 characters');
			return;
		}
		const usernameRegex = /^[a-zA-Z0-9_\s]+$/;
		if (!usernameRegex.test(trimmedUsername)) {
			toast.error(
				'Username can only contain letters, numbers, spaces, and underscores',
			);
			return;
		}
		if (isJoining) return;
		setIsJoining(true);
		try {
			const BACKEND_URL =
				import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
			const response = await fetch(
				`${BACKEND_URL}/room/${trimmedRoomId}/exists`,
			);
			if (!response.ok) throw new Error('Failed to validate room');
			const data = await response.json();
			if (!data.exists) {
				toast.error('Room does not exist. Check the ID or create a new room.');
				setIsJoining(false);
				return;
			}
			navigate(`/editor/${trimmedRoomId}`, {
				state: { username: trimmedUsername },
			});
		} catch (error) {
			console.error('Error validating room:', error);
			toast.error('Failed to validate room. Please try again.');
			setIsJoining(false);
		}
	};

	const handleInputEnter = (e) => {
		if (e.code === 'Enter') joinRoom();
	};

	const handleLogout = async () => {
		await signOut();
	};

	return (
		<div className="home">
			<header className="home__header">
				<div className="home__header-left">
					<Avatar username={username || 'U'} size="sm" />
					<span className="home__user-email">{user?.email}</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					iconLeft={<LogOut size={14} />}
					onClick={handleLogout}
				>
					Sign out
				</Button>
			</header>

			<motion.main
				className="home__main"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: 'easeOut' }}
			>
				<div className="home__brand">
					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						Code<span>Sketch</span>
					</motion.h1>
					<p className="home__tagline">Real-time collaborative code editor</p>
				</div>

				<Card className="home__card">
					<div className="home__form">
						<Input
							label="Your Name"
							placeholder="Enter your name"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							onKeyUp={handleInputEnter}
							disabled={isJoining}
						/>

						<Input
							label="Room ID"
							placeholder="Paste a room ID to join"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							onKeyUp={handleInputEnter}
							disabled={isJoining}
							suffix={
								<button
									className="home__generate-btn"
									onClick={generateRoomId}
									type="button"
									title="Generate Room ID"
								>
									<Sparkles size={14} />
									Generate
								</button>
							}
						/>

						{roomId && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
							>
								<Button
									variant="primary"
									className="home__join-btn"
									onClick={joinRoom}
									loading={isJoining}
									iconRight={<ArrowRight size={16} />}
								>
									Join Room
								</Button>
							</motion.div>
						)}

						<div className="home__divider">
							<span>or</span>
						</div>

						<Button
							variant="secondary"
							className="home__create-btn"
							onClick={createRoom}
							iconLeft={<Copy size={14} />}
						>
							Create New Room
						</Button>
					</div>
				</Card>
			</motion.main>

			<footer className="home__footer">
				<p>
					Built by{' '}
					<a href="https://www.meghan31.me" target="_blank" rel="noreferrer">
						Meghan31
					</a>
				</p>
			</footer>
		</div>
	);
};

export default Home;
