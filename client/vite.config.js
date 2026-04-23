import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { version } from './package.json';

let commitHash = 'unknown';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* no .git in build env */ }

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_COMMIT__:  JSON.stringify(commitHash),
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
    },
  },
});
