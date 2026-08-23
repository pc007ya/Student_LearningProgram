import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'src/modules/earth-orbit/index.ts'),
      formats: ['es'],
      fileName: () => 'earth-orbit-v01.js',
    },
    outDir: 'modules/earth-orbit',
    rollupOptions: {
      output: {
        assetFileNames: 'earth-orbit-v01.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
