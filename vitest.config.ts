import { defineConfig } from 'vitest/config';

export default defineConfig({
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
