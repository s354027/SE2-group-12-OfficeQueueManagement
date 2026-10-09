import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // the backend CORS config expects this port
    proxy: { '/api': 'http://localhost:3001' },
  },
});
