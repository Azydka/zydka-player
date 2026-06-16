import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'zydka-player': 'src/index.ts' },
  format: ['iife'],
  outDir: 'assets/js',
  outExtension: () => ({ js: '.js' }),
  target: 'es2017',
  splitting: false,
  clean: false,
});
