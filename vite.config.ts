import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import express from 'express';
import {createTutor} from './api/tutor.js';
import {createTranscriber} from './api/transcribe.js';

export default defineConfig(({ mode }) => {
  const config = { ...loadEnv(mode, process.cwd(), ['OPENAI_', 'ELEVENLABS_', 'TUTOR_', 'CLUB_']), ...process.env };
  const tutor = express();
  tutor.use(express.json({ limit: '96kb' }));
  tutor.all('/', createTutor(config));
  const transcribe = express();
  transcribe.use(express.raw({ type: () => true, limit: '4mb' }));
  transcribe.all('/', createTranscriber(config));
  const mountTutor = server => {
    server.middlewares.use('/api/tutor', tutor);
    server.middlewares.use('/api/transcribe', transcribe);
  };
  return {
    plugins: [react(), tailwindcss(), { name: 'club-tutor', configureServer: mountTutor, configurePreviewServer: mountTutor }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
