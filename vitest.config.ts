import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite's default TS filter is /\.(m?ts|[jt]sx)$/, which misses the `.cts`
  // loader, whose tests then fail to parse rather than fail to pass.
  esbuild: { include: [/\.[cm]?ts$/, /\.[jt]sx$/] },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    // A test that only passes on a retry is a broken test, not a slow one.
    retry: 0,
    // `.only` left in a commit would silently shrink the suite.
    allowOnly: false,
    // An empty run means the include glob broke, which should be loud.
    passWithNoTests: false,
  },
});
