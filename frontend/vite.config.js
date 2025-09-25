import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_PROXY_TARGET = process.env.VITE_DEV_SERVER_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: DEV_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
