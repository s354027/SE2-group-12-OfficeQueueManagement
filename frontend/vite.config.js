import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // When the backend exists, forward /api to it, e.g.:
  // server: { proxy: { '/api': 'http://localhost:3001' } },
});
