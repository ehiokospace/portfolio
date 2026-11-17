import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  esbuild: { jsx: 'automatic' },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'spatial-renderer.tsx',
      formats: ['es'],
      fileName: () => 'spatial-renderer.js',
    },
  },
})
