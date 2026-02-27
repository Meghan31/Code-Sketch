import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.js'],
		css: false,
		// Provide dummy env vars so supabase.js doesn't throw during module init
		env: {
			VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
			VITE_SUPABASE_ANON_KEY: 'placeholder-anon-key',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.{js,jsx}'],
			exclude: ['src/main.jsx', 'src/config/**', 'src/test/**'],
		},
	},
});
