import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const DEFAULT_REMOTE_ENTRY = {
  development: 'http://localhost:3001/remoteEntry.js',
  production: 'https://remote-app-9j8.pages.dev/remoteEntry.js',
} as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const remoteEntry =
    env.VITE_REMOTE_ENTRY ||
    (mode === 'development'
      ? DEFAULT_REMOTE_ENTRY.development
      : DEFAULT_REMOTE_ENTRY.production);

  return {
    plugins: [
      react(),
      federation({
        name: 'host_app',
        remotes: {
          // remote_app 是 import 用的别名，不要改；只改后面的入口 URL
          remote_app: `remote_app@${remoteEntry}`,
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
      }),
    ],
  };
});
