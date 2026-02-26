import PropTypes from 'prop-types';
import { Component, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
	useLocation,
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRoom } from './context/RoomContext';
import EditorPage from './pages/code-editor/EditorPage.jsx';
import Home from './pages/home/Home.jsx';
import Login from './pages/login/Login.jsx';

// Error Boundary Component
class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error('Error caught by boundary:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '100vh',
						flexDirection: 'column',
						gap: '16px',
						backgroundColor: '#0a0a0b',
						color: '#fafafa',
						fontFamily: 'Inter, -apple-system, sans-serif',
					}}
				>
					<h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
						Something went wrong
					</h1>
					<p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
						{this.state.error?.message || 'An unexpected error occurred'}
					</p>
					<button
						onClick={() => window.location.reload()}
						style={{
							padding: '8px 16px',
							fontSize: '14px',
							cursor: 'pointer',
							backgroundColor: '#22c55e',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontWeight: 500,
							fontFamily: 'Inter, -apple-system, sans-serif',
						}}
					>
						Reload Page
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node,
};

// Enforces all navigation rules based on auth + room state.
// Must be rendered inside <Router> so useLocation works.
function NavigationGuard({ children }) {
	const location = useLocation();
	const { user, loading: authLoading } = useAuth();
	const { isInRoom, activeRoomId } = useRoom();

	const path = location.pathname;
	const isOnActiveRoom = path === `/editor/${activeRoomId}`;

	// Detect when user tries to access a *different* room while already in one
	const isDifferentRoom =
		!authLoading &&
		user &&
		isInRoom &&
		activeRoomId &&
		!isOnActiveRoom &&
		path.startsWith('/editor/');

	// Show toast as a side-effect (can't call during render)
	useEffect(() => {
		if (isDifferentRoom) {
			toast.error("You're already in a room. Leave your current room first.", {
				id: 'room-guard',
			});
		}
	}, [isDifferentRoom]);

	// Wait for auth to resolve before applying guards
	if (authLoading) return children;

	// Rule: in active room → always stay in active room
	if (user && isInRoom && activeRoomId && !isOnActiveRoom) {
		return <Navigate to={`/editor/${activeRoomId}`} replace />;
	}

	// Rule: logged in without room → off login page
	if (user && !isInRoom && path === '/login') {
		return <Navigate to="/" replace />;
	}

	return children;
}

function App() {
	return (
		<ErrorBoundary>
			<AuthProvider>
				<RoomProvider>
					<Toaster
						position="top-right"
						toastOptions={{
							style: {
								background: '#141417',
								color: '#fafafa',
								border: '1px solid #27272a',
								fontFamily: 'Inter, -apple-system, sans-serif',
								fontSize: '14px',
								borderRadius: '8px',
							},
							success: {
								iconTheme: { primary: '#22c55e', secondary: '#141417' },
								duration: 3000,
							},
							error: {
								iconTheme: { primary: '#ef4444', secondary: '#141417' },
								duration: 4000,
							},
						}}
					/>
					<Router>
						<NavigationGuard>
							<Routes>
								<Route path="/login" element={<Login />} />
								<Route
									path="/"
									element={
										<ProtectedRoute>
											<Home />
										</ProtectedRoute>
									}
								/>
								<Route
									path="/editor/:roomId"
									element={
										<ProtectedRoute>
											<EditorPage />
										</ProtectedRoute>
									}
								/>
								<Route path="*" element={<Navigate to="/" replace />} />
							</Routes>
						</NavigationGuard>
					</Router>
				</RoomProvider>
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default App;
