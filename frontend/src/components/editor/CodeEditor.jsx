// import Editor from '@monaco-editor/react';
// import PropTypes from 'prop-types';
// import { useEffect, useRef, useState } from 'react';
// import ACTIONS from '../../socket/actions';

// import Output from '../output/Output';
// import './CodeEditor.scss';

// const CodeEditor = ({ socketRef, roomId, onCodeChange }) => {
// 	const [code, setCode] = useState('// Write your code here');
// 	const [language, setLanguage] = useState('cpp');

// 	const editorRef = useRef();
// 	const [isExecuting, setIsExecuting] = useState(false);

// 	useEffect(() => {
// 		const currentSocket = socketRef.current;

// 		if (currentSocket) {
// 			// Listen for code changes from other users
// 			currentSocket.on(ACTIONS.CODE_CHANGED, ({ code }) => {
// 				if (code !== undefined) {
// 					setCode(code);
// 					if (onCodeChange) {
// 						onCodeChange(code);
// 					}
// 				}
// 			});

// 			// Listen for language changes from other users
// 			currentSocket.on(ACTIONS.LANGUAGE_CHANGED, ({ language }) => {
// 				if (language !== undefined) {
// 					setLanguage(language);
// 				}
// 			});

// 			// Listen for code execution results
// 			// currentSocket.on(ACTIONS.EXECUTION_RESULT, ({  }) => {
// 			// 	setOutput(output);
// 			// 	setIsExecuting(false);
// 			// });

// 			// Listen for code sync when joining a room
// 			currentSocket.on(ACTIONS.SYNC_CODE, ({ code, language }) => {
// 				if (code !== undefined) {
// 					setCode(code);
// 					if (onCodeChange) {
// 						onCodeChange(code);
// 					}
// 				}
// 				if (language !== undefined) {
// 					setLanguage(language);
// 				}
// 			});
// 		}

// 		return () => {
// 			if (currentSocket) {
// 				currentSocket.off(ACTIONS.CODE_CHANGED);
// 				currentSocket.off(ACTIONS.LANGUAGE_CHANGED);
// 				currentSocket.off(ACTIONS.EXECUTION_RESULT);
// 				currentSocket.off(ACTIONS.SYNC_CODE);
// 			}
// 		};
// 	}, [socketRef.current]);

// 	const handleCodeChange = (newCode) => {
// 		setCode(newCode);
// 		if (onCodeChange) {
// 			onCodeChange(newCode);
// 		}

// 		// Emit code change event to other users
// 		if (socketRef.current) {
// 			socketRef.current.emit(ACTIONS.CODE_CHANGE, {
// 				roomId,
// 				code: newCode,
// 			});
// 		}
// 	};

// 	const onMount = (editor) => {
// 		editorRef.current = editor;
// 		editor.focus();
// 	};

// 	const handleLanguageChange = (e) => {
// 		const newLanguage = e.target.value;
// 		setLanguage(newLanguage);

// 		// Emit language change event to other users
// 		if (socketRef.current) {
// 			socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
// 				roomId,
// 				language: newLanguage,
// 			});
// 		}
// 	};

// 	const submitCode = () => {
// 		setIsExecuting(true);
// 		// setOutput('Executing code...');

// 		// Emit code execution event
// 		if (socketRef.current) {
// 			socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
// 				roomId,
// 				code,
// 				language,
// 			});
// 		}
// 	};

// 	return (
// 		<div className="main-block">
// 			<div className="prog-language">
// 				<button className="run-btn" onClick={submitCode} disabled={isExecuting}>
// 					{isExecuting ? 'Running...' : 'Run'}
// 				</button>
// 				<select
// 					className="language"
// 					value={language}
// 					onChange={handleLanguageChange}
// 				>
// 					<option value="cpp">C++</option>
// 					<option value="c">C</option>
// 					<option value="javascript">Javascript</option>
// 					<option value="java">Java</option>
// 					<option value="python">Python</option>
// 				</select>
// 			</div>
// 			<div className="code-block">
// 				<div className="editor">
// 					<Editor
// 						height="40vh"
// 						language={language}
// 						value={code}
// 						onChange={handleCodeChange}
// 						onMount={onMount}
// 						theme="vs-dark"
// 						options={{
// 							minimap: { enabled: false },
// 							showUnused: false,
// 							folding: false,
// 							lineNumbersMinChars: 3,
// 							fontSize: 16,
// 							scrollBeyondLastLine: false,
// 							automaticLayout: true,
// 						}}
// 					/>
// 				</div>
// 				{/* <div className="output">
// 					<p className="out-heading">Output</p>
// 					<div className="output-box">
// 						<p className="output-text">{output}</p>
// 					</div>
// 				</div> */}

// 				<Output editorRef={editorRef} language={language} />
// 			</div>
// 		</div>
// 	);
// };
// CodeEditor.propTypes = {
// 	socketRef: PropTypes.shape({
// 		current: PropTypes.object,
// 	}).isRequired,
// 	roomId: PropTypes.string.isRequired,
// 	onCodeChange: PropTypes.func,
// };

// export default CodeEditor;

import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import ACTIONS from '../../socket/actions';
import Output from '../output/Output';
import './CodeEditor.scss';

const CodeEditor = ({ socketRef, roomId, onCodeChange }) => {
	const [code, setCode] = useState('// Write your code here');
	const [language, setLanguage] = useState('cpp');
	const editorRef = useRef();

	useEffect(() => {
		const currentSocket = socketRef.current;
		if (!currentSocket) return;

		const handleCodeChanged = ({ code: newCode }) => {
			if (newCode !== undefined && newCode !== code) {
				setCode(newCode);
				if (onCodeChange) {
					onCodeChange(newCode);
				}
			}
		};

		const handleLanguageChanged = ({ language: newLanguage }) => {
			if (newLanguage !== undefined && newLanguage !== language) {
				setLanguage(newLanguage);
			}
		};

		const handleSyncCode = ({ code: syncedCode, language: syncedLanguage }) => {
			if (syncedCode !== undefined) {
				setCode(syncedCode);
				if (onCodeChange) {
					onCodeChange(syncedCode);
				}
			}
			if (syncedLanguage !== undefined) {
				setLanguage(syncedLanguage);
			}
		};

		// Register all listeners
		currentSocket.on(ACTIONS.CODE_CHANGED, handleCodeChanged);
		currentSocket.on(ACTIONS.LANGUAGE_CHANGED, handleLanguageChanged);
		currentSocket.on(ACTIONS.SYNC_CODE, handleSyncCode);

		// Cleanup all listeners
		return () => {
			currentSocket.off(ACTIONS.CODE_CHANGED, handleCodeChanged);
			currentSocket.off(ACTIONS.LANGUAGE_CHANGED, handleLanguageChanged);
			currentSocket.off(ACTIONS.SYNC_CODE, handleSyncCode);
		};
	}, [code, language, onCodeChange, socketRef]);

	const handleCodeChange = useCallback(
		(newCode) => {
			if (newCode === code) return; // Prevent unnecessary updates

			setCode(newCode);
			if (onCodeChange) {
				onCodeChange(newCode);
			}

			// Emit code change event to other users
			if (socketRef.current) {
				socketRef.current.emit(ACTIONS.CODE_CHANGE, {
					roomId,
					code: newCode,
				});
			}
		},
		[code, onCodeChange, roomId, socketRef]
	);

	const onMount = (editor) => {
		editorRef.current = editor;
		editor.focus();
	};

	const handleLanguageChange = (e) => {
		const newLanguage = e.target.value;
		setLanguage(newLanguage);

		// Emit language change event to other users
		if (socketRef.current) {
			socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
				roomId,
				language: newLanguage,
			});
		}
	};

	return (
		<div className="main-block">
			<div className="prog-language">
				<select
					className="language"
					value={language}
					onChange={handleLanguageChange}
				>
					<option value="cpp">C++</option>
					<option value="c">C</option>
					<option value="javascript">Javascript</option>
					<option value="java">Java</option>
					<option value="python">Python</option>
				</select>
			</div>
			<div className="code-block">
				<div className="editor">
					<Editor
						height="40vh"
						language={language}
						value={code}
						onChange={handleCodeChange}
						onMount={onMount}
						theme="vs-dark"
						options={{
							minimap: { enabled: false },
							showUnused: false,
							folding: false,
							lineNumbersMinChars: 3,
							fontSize: 16,
							scrollBeyondLastLine: false,
							automaticLayout: true,
						}}
					/>
				</div>
				<Output editorRef={editorRef} language={language} />
			</div>
		</div>
	);
};

CodeEditor.propTypes = {
	socketRef: PropTypes.shape({
		current: PropTypes.object,
	}).isRequired,
	roomId: PropTypes.string.isRequired,
	onCodeChange: PropTypes.func,
};

export default CodeEditor;
