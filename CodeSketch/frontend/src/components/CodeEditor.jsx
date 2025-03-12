// import React from 'react'
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import './CodeEditor.scss';

const CodeEditor = () => {
	const [code, setCode] = useState('');
	const [language, setLanguage] = useState('cpp');

	const handleCodeChange = (newcode) => {
		setCode(newcode);
		console.log(newcode);
		console.log(language);
	};
	const submitCode = () => {
		console.log('On SUBMITTING CODE');

		console.log(language);
		console.log(code);
	};
	return (
		<div className="main-block">
			<div className="prog-language">
				<button className="run-btn" onClick={submitCode}>
					Run
				</button>
				<select
					className="language"
					value={language}
					onChange={(e) => setLanguage(e.target.value)}
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
						// defaultLanguage="cpp"
						language={language}
						defaultValue="// Write your code here"
						value={code}
						onChange={handleCodeChange}
						theme="vs-dark"
						options={{
							// wordWrap: 'on',
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
				<div className="output">
					<p className="out-heading">Output</p>
					<div className="output-box">
						<p className="output-text">
							Output will be displayed hereOutput will be displayed hereOutput
							will be displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed hereOutput will be displayed hereOutput will be
							displayed here
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CodeEditor;
