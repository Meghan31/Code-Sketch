import { useAuth } from '../../context/AuthContext';
import './Login.scss';

const Login = () => {
	const { signInWithGoogle, loading } = useAuth();

	const handleGoogleSignIn = async () => {
		await signInWithGoogle();
	};

	return (
		<div className="loginPageWrapper">
			<div className="loginFormWrapper">
				<div className="loginHeader">
					<img
						src="https://img.icons8.com/ios/452/code.png"
						alt="code"
						height={60}
						width={60}
					/>
					<h1>CodeSketch</h1>
					<p>Real-time collaborative code editor</p>
				</div>

				<div className="loginContent">
					<h2>Sign In Required</h2>
					<p className="loginDescription">
						Please sign in with your Google account to access CodeSketch and
						start collaborating in real-time.
					</p>

					<button
						className="googleSignInBtn"
						onClick={handleGoogleSignIn}
						disabled={loading}
					>
						<img
							src="https://img.icons8.com/color/48/google-logo.png"
							alt="Google"
							height={24}
							width={24}
						/>
						{loading ? 'Signing in...' : 'Sign in with Google'}
					</button>

					<div className="loginFooter">
						<p>Secure authentication powered by Supabase</p>
					</div>
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

export default Login;
