import PropTypes from 'prop-types';
import { Component } from 'react';
import { Toaster } from 'react-hot-toast';
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
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
						gap: '20px',
						backgroundColor: '#242424',
						color: 'white',
					}}
				>
					<h1>Something went wrong</h1>
					<p style={{ color: '#888' }}>
						{this.state.error?.message || 'An unexpected error occurred'}
					</p>
					<button
						onClick={() => window.location.reload()}
						style={{
							padding: '10px 20px',
							fontSize: '16px',
							cursor: 'pointer',
							backgroundColor: '#618b4e',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
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

function App() {
	return (
		<ErrorBoundary>
			<AuthProvider>
				<Toaster
					position="top-right"
					toastOptions={{
						success: {
							style: {
								backgroundColor: '#4caf50',
								color: '#fff',
							},
							duration: 3000,
						},
						error: {
							style: {
								backgroundColor: '#f44336',
								color: '#fff',
							},
							duration: 4000,
						},
					}}
				/>
				<Router>
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
				</Router>
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default App;
