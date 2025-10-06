import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 25550,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:25551',
        changeOrigin: true,
      }
    }
  }
})
