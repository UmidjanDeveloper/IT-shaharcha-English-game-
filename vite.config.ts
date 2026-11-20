import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import express from 'express';
import {createTutor} from './api/tutor.js';

export default defineConfig(({ mode }) => {
  const config = { ...loadEnv(mode, process.cwd(), ['OPENAI_', 'ELEVENLABS_']), ...process.env };
  const tutor = express();
  tutor.use(express.json({ limit: '32kb' }));
  tutor.all('/', createTutor(config));
  const mountTutor = server => { server.middlewares.use('/api/tutor', tutor); };
  return {
    plugins: [react(), tailwindcss(), { name: 'club-tutor', configureServer: mountTutor, configurePreviewServer: mountTutor }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
