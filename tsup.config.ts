import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['iife', 'esm', 'cjs'],
  globalName: 'AndroidManifestFixPlugin',
  target: 'es2015',
  platform: 'browser',
  clean: true,
  dts: true,
  minify: true,
  sourcemap: false,
})
