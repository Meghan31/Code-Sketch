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

		currentSocket.on(ACTIONS.CODE_CHANGED, handleCodeChanged);
		currentSocket.on(ACTIONS.LANGUAGE_CHANGED, handleLanguageChanged);
		currentSocket.on(ACTIONS.SYNC_CODE, handleSyncCode);

		return () => {
			currentSocket.off(ACTIONS.CODE_CHANGED, handleCodeChanged);
			currentSocket.off(ACTIONS.LANGUAGE_CHANGED, handleLanguageChanged);
			currentSocket.off(ACTIONS.SYNC_CODE, handleSyncCode);
		};
	}, [code, language, onCodeChange, socketRef]);

	const handleCodeChange = useCallback(
		(newCode) => {
			if (newCode === code) return;

			setCode(newCode);
			if (onCodeChange) {
				onCodeChange(newCode);
			}

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
				<Output 
					editorRef={editorRef} 
					language={language} 
					socketRef={socketRef}
					roomId={roomId}
				/>
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