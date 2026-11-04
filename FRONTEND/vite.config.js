import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from parent root directory and FRONTEND directory
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../'), '');
  const localEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...localEnv };

  const backendPort = env.PORT || process.env.PORT || '5001';
  const backendUrl = env.BACKEND_URL || `http://localhost:${backendPort}`;

  return {
    plugins: [react()],
    envDir: '../',
    resolve: {
      alias: {
        '@maps': path.resolve(__dirname, '../MAPS'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
          rewriteWsOrigin: true,
          configure: (proxy) => {
            let lastProxyErrorTime = 0;
            proxy.on('error', (err, _req, res) => {
              const now = Date.now();
              // Prevent flooding Vite console when backend is restarting or temporarily offline
              if (now - lastProxyErrorTime > 5000) {
                console.warn(`[vite:proxy] Backend at ${backendUrl} is not responding (${err.code || err.message}). Socket will reconnect once backend is active.`);
                lastProxyErrorTime = now;
              }
              if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                  'Retry-After': '2',
                });
                res.end(JSON.stringify({ error: 'Backend server restarting or unavailable', code: 'BACKEND_OFFLINE' }));
              }
            });
          },
        },
      },
    },
  };
});
