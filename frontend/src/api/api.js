import axios from 'axios';
import { LANGUAGE_VERSIONS } from './constant';

const API = axios.create({
	baseURL: 'https://emkc.org/api/v2/piston',
});

export const executeCode = async (sourceCode, language, stdin = '') => {
	const response = await API.post('/execute', {
		language: language,
		version: LANGUAGE_VERSIONS[language],
		files: [
			{
				content: sourceCode,
			},
		],
		stdin,
	});
	console.log('Response from API:', response.data);
	console.log(response.data);
	return response.data;
};
