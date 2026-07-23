import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Deploy at site root by default. If MGB hosts under a sub-path, set this to
  // '/your-path/' before building.
  base: '/',
});
