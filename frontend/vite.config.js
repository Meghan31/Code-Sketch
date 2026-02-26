import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		host: true,
		strictPort: false,
	},
	preview: {
		port: 4173,
		host: true,
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					'monaco-editor': ['@monaco-editor/react'],
					'socket-io': ['socket.io-client'],
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
				},
			},
		},
	},
});
