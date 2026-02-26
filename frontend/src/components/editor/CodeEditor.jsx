import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registerCodesketchTheme } from '../../config/monacoTheme';
import ACTIONS from '../../socket/actions';
import Output from '../output/Output';
import { KbdShortcut } from '../ui/Kbd';
import './CodeEditor.scss';

const LANGUAGE_OPTIONS = [
	{ value: 'cpp', label: 'C++' },
	{ value: 'c', label: 'C' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'java', label: 'Java' },
	{ value: 'python', label: 'Python' },
];

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
		[code, onCodeChange, roomId, socketRef],
	);

	const onMount = (editor, monaco) => {
		registerCodesketchTheme(monaco);
		monaco.editor.setTheme('codesketch');
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
		<div className="code-editor">
			<div className="code-editor__toolbar">
				<select
					className="code-editor__language"
					value={language}
					onChange={handleLanguageChange}
				>
					{LANGUAGE_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				<div className="code-editor__hint">
					<span>Run</span>
					<KbdShortcut keys={['Ctrl', 'Enter']} />
				</div>
			</div>
			<div className="code-editor__split">
				<div className="code-editor__editor">
					<Editor
						height="100%"
						language={language}
						value={code}
						onChange={handleCodeChange}
						onMount={onMount}
						theme="vs-dark"
						options={{
							minimap: { enabled: false },
							showUnused: false,
							folding: true,
							lineNumbersMinChars: 3,
							fontSize: 14,
							fontFamily: "'JetBrains Mono', monospace",
							fontLigatures: true,
							scrollBeyondLastLine: false,
							automaticLayout: true,
							bracketPairColorization: { enabled: true },
							cursorSmoothCaretAnimation: 'on',
							cursorBlinking: 'smooth',
							padding: { top: 12, bottom: 12 },
							renderLineHighlight: 'line',
							scrollbar: {
								verticalScrollbarSize: 6,
								horizontalScrollbarSize: 6,
							},
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
