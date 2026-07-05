import { defineConfig } from 'vitest/config'

// Scoped to apps/convex. The transform core is pure and web-safe, so a plain
// node environment is all the unit tests need.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
