import axios from 'axios';
import { LANGUAGE_VERSIONS } from './constant';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const API = axios.create({
	baseURL: BACKEND_URL,
	timeout: 15000, // 15 second timeout
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add response interceptor for better error handling
API.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.code === 'ECONNABORTED') {
			console.error('Request timeout - code execution took too long');
		} else if (error.response?.status === 429) {
			console.error('Rate limit exceeded');
		} else if (!error.response) {
			console.error('Network error - please check your connection');
		}
		return Promise.reject(error);
	},
);

export const executeCode = async (sourceCode, language, stdin = '') => {
	try {
		// Validate inputs
		if (!sourceCode || typeof sourceCode !== 'string') {
			throw new Error('Invalid source code');
		}

		if (!LANGUAGE_VERSIONS[language]) {
			throw new Error(`Unsupported language: ${language}`);
		}

		// Ensure stdin is a string
		const inputString = typeof stdin === 'string' ? stdin : String(stdin || '');

		const response = await API.post('/execute', {
			language,
			version: LANGUAGE_VERSIONS[language],
			files: [{ content: sourceCode }],
			stdin: inputString,
		});

		// Log only in development
		if (import.meta.env.DEV) {
			console.log('API Response:', response.data);
		}

		return response.data;
	} catch (error) {
		console.error('Code execution error:', error.message || error);
		throw error;
	}
};
