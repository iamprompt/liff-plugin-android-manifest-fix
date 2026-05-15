import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'es2015',
    platform: 'browser',
    clean: true,
    dts: true,
    minify: true,
    sourcemap: false,
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' }
    },
  },
  {
    entry: { 'index.browser': 'src/browser.ts' },
    format: ['iife'],
    globalName: 'androidManifestFixPlugin',
    target: 'es2015',
    platform: 'browser',
    minify: true,
    sourcemap: false,
  },
])
