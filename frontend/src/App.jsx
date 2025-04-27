import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import EditorPage from './pages/code-editor/EditorPage.jsx';
import Home from './pages/home/Home.jsx';

function App() {
	return (
		<>
			<div>
				<Toaster
					position="top-right"
					toastOptions={{
						success: {
							style: {
								backgroundColor: '#4caf50',
								color: '#fff',
							},
						},
						error: {
							style: {
								backgroundColor: '#f44336',
								color: '#fff',
							},
						},
					}}
				></Toaster>
			</div>
			<Router>
				<Routes>
					<Route path="/" element={<Home />}></Route>
					<Route path="/editor/:roomId" element={<EditorPage />}></Route>
				</Routes>
			</Router>
		</>
	);
}

export default App;
