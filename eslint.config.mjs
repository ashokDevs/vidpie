import eslint from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'packages/*/templates/**',
      // Fixtures are inputs to the stamp, not code we ship. Some are deliberately
      // malformed, and linting them would mean writing them wrong on purpose twice.
      '**/__fixtures__/**',
    ],
  },
  eslint.configs.recommended,
  // Type-aware rules. The picker spawns processes, serves HTTP and drives
  // webpack, so unhandled promises are the failure mode most worth catching.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['vitest.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
