import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  treeshake: true,
  replaceNodeEnv: true,
  esbuildOptions(options) {
    options.alias = {
      '@sizeupdashboard/convex': '@sizeupdashboard/convex',
    }
  },
  external: ['@sizeupdashboard/convex'],
})
