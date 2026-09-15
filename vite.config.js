import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Where the app will live on the web server.
  //   '/'                 a domain of its own
  //   '/spot-the-scam/'   a subfolder, as on Hostinger shared hosting
  // Set VITE_BASE_PATH in .env before building. Asset URLs are written
  // against this, so getting it wrong means a blank page and 404s.
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [react()],
  };
});
