import type { LoaderContext } from 'webpack';

import type { StampSourceOptions } from './babel/transform.js';

type Options = Pick<StampSourceOptions, 'root'>;
type InputSourceMap = StampSourceOptions['inputSourceMap'];

function stampLoader(
  this: LoaderContext<Options>,
  source: string,
  inputSourceMap?: InputSourceMap,
): void {
  const callback = this.async();
  const root = this.getOptions().root ?? this.rootContext;

  const done = (code: string, map: InputSourceMap | null): void => {
    callback(null, code, map as Parameters<typeof callback>[2]);
  };

  void (async (): Promise<void> => {
    try {
      const { stampSource } = await import('./babel/transform.js');
      const result = await stampSource(source, {
        filename: this.resourcePath,
        root,
        inputSourceMap,
      });

      done(result.code, result.map ?? inputSourceMap ?? null);
    } catch (error) {
      this.emitWarning(error instanceof Error ? error : new Error(String(error)));
      done(source, inputSourceMap ?? null);
    }
  })();
}

export = stampLoader;
