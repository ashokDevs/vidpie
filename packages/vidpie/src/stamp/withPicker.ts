import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Configuration } from 'webpack';

export interface WithPickerOptions {
  /** Directory that stamped paths are made relative to. Defaults to cwd. */
  root?: string;
}

export type WebpackOverrideFn = (config: Configuration) => Configuration;

/**
 * Absolute path to the compiled loader.
 *
 * Resolved from the package root rather than from this file, so it answers
 * `dist/` whether it runs from `src/` under vitest or from `dist/` once
 * installed. `require.resolve` is not available: the package is ESM.
 */
const loaderPath = (): string => {
  let directory = dirname(fileURLToPath(import.meta.url));

  while (!existsSync(join(directory, 'package.json'))) {
    const parent = dirname(directory);

    if (parent === directory) {
      throw new Error('withPicker could not find the vidpie package root');
    }

    directory = parent;
  }

  return join(directory, 'dist', 'stamp', 'loader.cjs');
};

export const withPicker = (options: WithPickerOptions = {}): WebpackOverrideFn => {
  const root = options.root ?? process.cwd();

  return (currentConfig) => ({
    ...currentConfig,
    module: {
      ...currentConfig.module,
      rules: [
        ...(currentConfig.module?.rules ?? []),
        {
          test: /\.(tsx|jsx)$/,
          exclude: /node_modules/,
          // Remotion's esbuild-loader is a normal rule, so without this the
          // types are already stripped and there is no JSX left to stamp.
          enforce: 'pre',
          use: [{ loader: loaderPath(), options: { root } }],
        },
      ],
    },
  });
};
