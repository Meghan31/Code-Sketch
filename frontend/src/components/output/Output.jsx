import PropTypes from 'prop-types';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { executeCode } from '../../api/api';
import './Output.scss';

const Output = ({ editorRef, language }) => {
	const [output, setOutput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [stdin, setStdin] = useState('');

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

			const { run: result } = await executeCode(sourceCode, language, stdin);

			const outputText = result.output || result.stderr || 'No output';
			setOutput(outputText);
			setIsError(!!result.stderr);

			if (result.stderr) {
				toast.error('Code execution completed with errors');
			}
		} catch (error) {
			console.error('Execution error:', error);
			setIsError(true);

			// Better error messages
			if (error.response?.status === 429) {
				setOutput('Rate limit exceeded. Please wait before running again.');
				toast.error('Too many requests. Please wait.');
			} else if (error.response?.status === 400) {
				setOutput('Invalid code or input. Please check your code.');
				toast.error('Invalid request');
			} else if (error.code === 'ECONNABORTED') {
				setOutput('Request timeout. The code took too long to execute.');
				toast.error('Execution timeout');
			} else if (!error.response) {
				setOutput('Network error. Please check your connection.');
				toast.error('Network error');
			} else {
				setOutput('Error running code. Please try again.');
				toast.error('Error running code');
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
					onChange={(e) => setStdin(e.target.value)}
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
};

export default Output;
