// Socket action types for consistent messaging between client and server
const ACTIONS = {
	JOIN: 'join',
	JOINED: 'userJoined',
	LEAVE: 'leave',
	LEFT: 'userLeft',
	CODE_CHANGE: 'codeChange',
	CODE_CHANGED: 'codeChanged',
	SYNC_CODE: 'syncCode',
	LANGUAGE_CHANGE: 'languageChange',
	LANGUAGE_CHANGED: 'languageChanged',
	EXECUTE_CODE: 'executeCode',
	EXECUTION_RESULT: 'executionResult',
	DISCONNECTED: 'disconnect',
	ERROR: 'error',
};

export default ACTIONS;
