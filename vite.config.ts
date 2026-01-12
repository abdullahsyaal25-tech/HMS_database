import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
      laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'], // Adjust to your TS entry
      refresh: true,
    }),
    react(),
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: false,
        // Proxy API requests to Laravel development server
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                ws: true,
                changeOrigin: true,
            },
            '/sanctum': {
                target: 'http://127.0.0.1:8000',
                ws: true,
                changeOrigin: true,
            },
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});