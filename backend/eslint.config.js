import js from '@eslint/js';

export default [
	{
		ignores: ['node_modules/**', 'coverage/**'],
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				process: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				clearInterval: 'readonly',
				setInterval: 'readonly',
				fetch: 'readonly',
				AbortSignal: 'readonly',
				URL: 'readonly',
				Buffer: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
		},
	},
];
