import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      legacy({
        targets: ['defaults', 'chrome >= 30', 'android >= 4', 'not IE 11'],
        polyfills: [
          'es.promise',
          'es.promise.finally',
          'es.array.iterator',
          'es.array.find',
          'es.array.includes',
          'es.object.assign',
          'es.object.keys',
          'es.string.includes',
          'es.string.starts-with',
          'es.string.ends-with',
          'es.set',
          'es.map'
        ],
        modernPolyfills: true,
      })
    ],
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
