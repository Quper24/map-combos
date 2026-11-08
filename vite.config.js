import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { comboEditorImages } from './scripts/combo-editor-images.mjs';

export default defineConfig(({ command, mode }) => {
  const editor = command === 'serve' && mode === 'editor';
  return {
    plugins: [react(), editor && comboEditorImages()],
    base: '/',
    server: editor ? { host: '127.0.0.1', port: 5179, strictPort: true, cors: false } : undefined,
  };
});
