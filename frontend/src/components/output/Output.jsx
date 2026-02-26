import { Copy, Loader2, Play, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { executeCode } from '../../api/api';
import ACTIONS from '../../socket/actions';
import Button from '../ui/Button';
import './Output.scss';

const Output = ({ editorRef, language, socketRef, roomId }) => {
	const [output, setOutput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [stdin, setStdin] = useState('');
	const [activeTab, setActiveTab] = useState('output');

	// Keyboard shortcut: Ctrl+Enter to run
	useEffect(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				runCode();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language, stdin]);

	useEffect(() => {
		const currentSocket = socketRef.current;
		if (!currentSocket) return;

		const handleInputChanged = ({ stdin: newStdin }) => {
			if (newStdin !== stdin) setStdin(newStdin);
		};

		const handleExecutionStarted = ({ username }) => {
			setIsLoading(true);
			setOutput('');
			setActiveTab('output');
			toast.success(`${username} is running the code...`);
		};

		const handleExecutionResult = ({
			output: newOutput,
			isError: newIsError,
			username,
		}) => {
			setOutput(newOutput);
			setIsError(newIsError);
			setIsLoading(false);
			if (newIsError) {
				toast.error(`Code executed by ${username} with errors`);
			} else {
				toast.success(`Code executed successfully by ${username}`);
			}
		};

		const handleSyncCode = ({
			stdin: syncedStdin,
			output: syncedOutput,
			isError: syncedIsError,
		}) => {
			if (syncedStdin !== undefined) setStdin(syncedStdin);
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

	const handleInputChange = (e) => {
		const newStdin = e.target.value;
		setStdin(newStdin);
		if (socketRef.current) {
			socketRef.current.emit(ACTIONS.INPUT_CHANGE, {
				roomId,
				stdin: newStdin,
			});
		}
	};

	const copyOutput = () => {
		if (!output) return;
		navigator.clipboard
			.writeText(output)
			.then(() => toast.success('Output copied'))
			.catch(() => {});
	};

	const clearOutput = () => {
		setOutput('');
		setIsError(false);
	};

	const runCode = async () => {
		const sourceCode = editorRef.current?.getValue();
		if (!sourceCode || sourceCode.trim() === '') {
			toast.error('No code to run');
			return;
		}
		if (stdin.length > 10000) {
			toast.error('Input is too large (max 10KB)');
			return;
		}
		try {
			setIsLoading(true);
			setIsError(false);
			setOutput('');
			setActiveTab('output');
			if (socketRef.current) {
				socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
					roomId,
					code: sourceCode,
					language,
					stdin,
				});
			}
			const { run: result } = await executeCode(sourceCode, language, stdin);
			const outputText = result.output || result.stderr || 'No output';
			const hasError = !!result.stderr;
			setOutput(outputText);
			setIsError(hasError);
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
			if (error.response?.status === 429) {
				errorMessage = 'Rate limit exceeded. Please wait before running again.';
			} else if (error.response?.status === 400) {
				errorMessage = 'Invalid code or input. Please check your code.';
			} else if (error.code === 'ECONNABORTED') {
				errorMessage = 'Request timeout. The code took too long to execute.';
			} else if (!error.response) {
				errorMessage = 'Network error. Please check your connection.';
			}
			toast.error(errorMessage);
			setOutput(errorMessage);
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
		<div className="output-panel">
			<div className="output-panel__header">
				<div className="output-panel__tabs">
					<button
						className={`output-panel__tab ${activeTab === 'output' ? 'output-panel__tab--active' : ''}`}
						onClick={() => setActiveTab('output')}
					>
						Output
					</button>
					<button
						className={`output-panel__tab ${activeTab === 'input' ? 'output-panel__tab--active' : ''}`}
						onClick={() => setActiveTab('input')}
					>
						Input
					</button>
				</div>

				<div className="output-panel__actions">
					{activeTab === 'output' && output && (
						<>
							<button
								className="output-panel__icon-btn"
								onClick={copyOutput}
								title="Copy output"
							>
								<Copy size={14} />
							</button>
							<button
								className="output-panel__icon-btn"
								onClick={clearOutput}
								title="Clear output"
							>
								<Trash2 size={14} />
							</button>
						</>
					)}
					<Button
						variant="primary"
						size="sm"
						onClick={runCode}
						loading={isLoading}
						iconLeft={
							isLoading ? (
								<Loader2 size={14} className="output-panel__spinner" />
							) : (
								<Play size={14} />
							)
						}
					>
						Run
					</Button>
				</div>
			</div>

			<div className="output-panel__content">
				{activeTab === 'output' ? (
					<pre
						className={`output-panel__output ${isError ? 'output-panel__output--error' : ''}`}
					>
						{output ||
							(isLoading ? 'Running code...' : 'Run your code to see output')}
					</pre>
				) : (
					<textarea
						className="output-panel__input"
						placeholder="Enter input for the program (optional)"
						value={stdin}
						onChange={handleInputChange}
						disabled={isLoading}
						maxLength={10000}
					/>
				)}
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
