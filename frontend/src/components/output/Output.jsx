import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { executeCode } from '../../api/api';
import ACTIONS from '../../socket/actions';
import './Output.scss';

const Output = ({ editorRef, language, socketRef, roomId }) => {
	const [output, setOutput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [stdin, setStdin] = useState('');

	// Listen for socket events
	useEffect(() => {
		const currentSocket = socketRef.current;
		if (!currentSocket) return;

		// Handle input changes from other users
		const handleInputChanged = ({ stdin: newStdin }) => {
			if (newStdin !== stdin) {
				setStdin(newStdin);
			}
		};

		// Handle execution started by other users
		const handleExecutionStarted = ({ username }) => {
			setIsLoading(true);
			setOutput('');
			toast.success(`${username} is running the code...`);
		};

		// Handle execution results from other users
		const handleExecutionResult = ({ output: newOutput, isError: newIsError, username }) => {
			setOutput(newOutput);
			setIsError(newIsError);
			setIsLoading(false);

			if (newIsError) {
				toast.error(`Code executed by ${username} with errors`);
			} else {
				toast.success(`Code executed successfully by ${username}`);
			}
		};

		// Handle sync when joining
		const handleSyncCode = ({ stdin: syncedStdin, output: syncedOutput, isError: syncedIsError }) => {
			if (syncedStdin !== undefined) {
				setStdin(syncedStdin);
			}
			if (syncedOutput !== undefined) {
				setOutput(syncedOutput);
				setIsError(syncedIsError || false);
			}
		};

		currentSocket.on(ACTIONS.INPUT_CHANGED, handleInputChanged);
		currentSocket.on('executionStarted', handleExecutionStarted);
		currentSocket.on(ACTIONS.EXECUTION_RESULT, handleExecutionResult);
		currentSocket.on(ACTIONS.SYNC_CODE, handleSyncCode);

		return () => {
			currentSocket.off(ACTIONS.INPUT_CHANGED, handleInputChanged);
			currentSocket.off('executionStarted', handleExecutionStarted);
			currentSocket.off(ACTIONS.EXECUTION_RESULT, handleExecutionResult);
			currentSocket.off(ACTIONS.SYNC_CODE, handleSyncCode);
		};
	}, [socketRef, stdin]);

	// Handle input changes
	const handleInputChange = (e) => {
		const newStdin = e.target.value;
		setStdin(newStdin);

		// Emit input change to other users
		if (socketRef.current) {
			socketRef.current.emit(ACTIONS.INPUT_CHANGE, {
				roomId,
				stdin: newStdin,
			});
		}
	};

	const runCode = async () => {
		const sourceCode = editorRef.current?.getValue();

		if (!sourceCode || sourceCode.trim() === '') {
			toast.error('No code to run');
			return;
		}

		// Validate stdin size
		if (stdin.length > 10000) {
			toast.error('Input is too large (max 10KB)');
			return;
		}

		try {
			setIsLoading(true);
			setIsError(false);
			setOutput('');

			// Emit execution started to all users
			if (socketRef.current) {
				socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
					roomId,
					code: sourceCode,
					language,
					stdin,
				});
			}

			// Execute code via API
			const { run: result } = await executeCode(sourceCode, language, stdin);

			const outputText = result.output || result.stderr || 'No output';
			const hasError = !!result.stderr;

			setOutput(outputText);
			setIsError(hasError);

			// Broadcast result to all users
			if (socketRef.current) {
				socketRef.current.emit('executionResult', {
					roomId,
					output: outputText,
					isError: hasError,
				});
			}

			if (hasError) {
				toast.error('Code execution completed with errors');
			} else {
				toast.success('Code executed successfully');
			}
		} catch (error) {
			console.error('Execution error:', error);
			setIsError(true);

			let errorMessage = 'Error running code. Please try again.';

			// Better error messages
			if (error.response?.status === 429) {
				errorMessage = 'Rate limit exceeded. Please wait before running again.';
				toast.error('Too many requests. Please wait.');
			} else if (error.response?.status === 400) {
				errorMessage = 'Invalid code or input. Please check your code.';
				toast.error('Invalid request');
			} else if (error.code === 'ECONNABORTED') {
				errorMessage = 'Request timeout. The code took too long to execute.';
				toast.error('Execution timeout');
			} else if (!error.response) {
				errorMessage = 'Network error. Please check your connection.';
				toast.error('Network error');
			} else {
				toast.error('Error running code');
			}

			setOutput(errorMessage);

			// Broadcast error to all users
			if (socketRef.current) {
				socketRef.current.emit('executionResult', {
					roomId,
					output: errorMessage,
					isError: true,
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="output">
			<div className="head-block">
				<p className="out-heading">Output</p>
				<button className="run-btn" onClick={runCode} disabled={isLoading}>
					{isLoading ? 'Running...' : 'Run'}
				</button>
			</div>
			<div className="input-box">
				<textarea
					placeholder="Enter input for the program (optional)"
					value={stdin}
					onChange={handleInputChange}
					disabled={isLoading}
					maxLength={10000}
					style={{
						height: '10vh',
						width: '99%',
						marginBottom: '10px',
						overflowY: 'auto',
						resize: 'none',
						padding: '8px',
						fontFamily: 'monospace',
						fontSize: '14px',
						border: '1px solid #444',
						borderRadius: '4px',
						backgroundColor: '#d4d4d4',
						color: '#000000',
					}}
				/>
			</div>
			<div className="output-box">
				<pre
					style={{
						color: isError ? '#f48771' : '#35b723ff',
						backgroundColor: !isError ? '#1e1e1e' : '#1e1e1e',
						whiteSpace: 'pre-wrap',
						wordBreak: 'break-word',
						maxHeight: '200px',
						overflowY: 'auto',
						margin: 0,
						padding: '10px',
						fontFamily: 'monospace',
						fontSize: '14px',
						border: '1px solid #444',
						borderRadius: '20px',
						minHeight: '100px',
					}}
				>
					{output ||
						(isLoading ? 'Running code...' : 'Run your code to see output')}
				</pre>
			</div>
		</div>
	);
};

Output.propTypes = {
	editorRef: PropTypes.object.isRequired,
	language: PropTypes.string.isRequired,
	socketRef: PropTypes.shape({
		current: PropTypes.object,
	}).isRequired,
	roomId: PropTypes.string.isRequired,
};

export default Output;