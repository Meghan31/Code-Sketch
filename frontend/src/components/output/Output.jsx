import PropTypes from 'prop-types';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { executeCode } from '../api/api';
import './Output.scss';
const Output = ({ editorRef, language }) => {
	const [output, setOutput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [stdin, setStdin] = useState(''); // State for user input

	const runCode = async () => {
		console.log('Running code');
		const sourceCode = editorRef.current.getValue();
		if (!sourceCode) {
			console.log('No code to run');
			return;
		}
		try {
			setIsLoading(true);
			const { run: result } = await executeCode(sourceCode, language, stdin);
			setOutput(result.output);
			result.stderr ? setIsError(true) : setIsError(false);

			console.log('Code running');
		} catch (error) {
			console.log(error);
			toast.error('Error running code', { duration: 3000 });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="output">
			<div className="head-block">
				<p className="out-heading">Output</p>
				<button className="run-btn" onClick={runCode}>
					{isLoading ? 'Running...' : 'Run'}
				</button>
			</div>
			<div className="input-box">
				<textarea
					placeholder="Enter input for the program"
					value={stdin}
					onChange={(e) => setStdin(e.target.value)}
					rows="5"
					cols="40"
					style={{
						height: '10vh',
						width: '99%',
						marginBottom: '10px',
						// padding: '3px',
						overflowY: 'scroll',
						resize: 'none',
					}}
				/>
			</div>
			<div className="output-box">
				<div>
					<div className="output">
						<pre
							style={{
								color: isError ? 'red' : 'white',
							}}
						>
							{output}
						</pre>
					</div>
				</div>
			</div>
		</div>
	);
};

Output.propTypes = {
	editorRef: PropTypes.object.isRequired,
	language: PropTypes.string.isRequired,
};

export default Output;
