import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  treeshake: true,
  replaceNodeEnv: true,
  // Bundle everything (workspace convex pkg + all npm deps) so the Docker
  // runtime stage needs no node_modules at all.
  noExternal: [/.*/],
  // ws's optional native accelerators — required inside try/catch at runtime,
  // must stay external so esbuild doesn't fail resolving them.
  external: ['bufferutil', 'utf-8-validate'],
  banner: {
    // Bundled CJS deps (express, winston) use dynamic require, which doesn't
    // exist in ESM output without this shim.
    js: "import { createRequire as __tsupCreateRequire } from 'module'; const require = __tsupCreateRequire(import.meta.url);",
  },
})
