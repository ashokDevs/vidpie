import * as babel from '@babel/core';
import type { TransformOptions } from '@babel/core';

import { stampPlugin } from './plugin.js';

export interface StampResult {
  code: string;
  map: TransformOptions['inputSourceMap'];
}

export interface StampSourceOptions {
  filename: string;
  root: string;
  inputSourceMap?: TransformOptions['inputSourceMap'];
}

export const stampSource = async (
  source: string,
  options: StampSourceOptions,
): Promise<StampResult> => {
  const src = await babel.transformAsync(source, {
    babelrc: false,
    configFile: false,
    filename: options.filename,
    parserOpts: { plugins: ['typescript', 'jsx'] },
    retainLines: true,
    sourceMaps: true,
    inputSourceMap: options.inputSourceMap,
    plugins: [[stampPlugin, { root: options.root }]],
  });

  if (!src?.code) {
    return { code: source, map: options.inputSourceMap };
  }

  return { code: src.code, map: src.map };
};
