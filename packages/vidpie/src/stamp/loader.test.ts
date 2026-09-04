import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { PICKER_ATTRIBUTE } from './constants.js';
import stampLoader from './loader.cjs';

/** The loader touches five of LoaderContext's ~40 members. Fake those, cast. */
const asContext = (context: object): ThisParameterType<typeof stampLoader> =>
  context as ThisParameterType<typeof stampLoader>;

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = join(HERE, 'babel', '__fixtures__', 'input');

const read = (name: string): Promise<string> => readFile(join(INPUT_DIR, name), 'utf8');

interface Run {
  error: Error | null | undefined;
  code: string | undefined;
  map: unknown;
  warnings: unknown[];
}

/** Drives the loader with the four LoaderContext members it actually uses. */
const run = (
  source: string,
  options: { root?: string } = {},
  {
    name = 'host-elements.tsx',
    inputSourceMap = undefined as Parameters<typeof stampLoader>[1],
  } = {},
): Promise<Run> =>
  new Promise((resolve) => {
    const warnings: unknown[] = [];
    const context = {
      resourcePath: join(INPUT_DIR, name),
      rootContext: INPUT_DIR,
      getOptions: () => options,
      emitWarning: (warning: unknown) => warnings.push(warning),
      async: () => (error: Error | null, code?: string, map?: unknown) =>
        resolve({ error, code, map, warnings }),
    };

    stampLoader.call(asContext(context), source, inputSourceMap);
  });

describe('stamp loader', () => {
  it('passes an unparseable file through unchanged and warns', async () => {
    const source = 'export const Broken = () => <div';
    const { error, code, warnings } = await run(
      source,
      { root: INPUT_DIR },
      { name: 'broken.tsx' },
    );

    expect(error).toBeNull();
    expect(code).toBe(source);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toBeInstanceOf(Error);
    expect((warnings[0] as Error).message).toContain('broken.tsx');
  });

  it('threads an input source map through', async () => {
    const inputSourceMap = {
      version: 3,
      file: 'Scene.tsx',
      sources: ['Scene.tsx'],
      names: [],
      mappings: '',
    };
    const { map } = await run('', { root: INPUT_DIR }, { name: 'empty.tsx', inputSourceMap });

    expect(map).toBe(inputSourceMap);
  });

  it('keeps the input source map when the file cannot be parsed', async () => {
    const inputSourceMap = {
      version: 3,
      file: 'broken.tsx',
      sources: ['broken.tsx'],
      names: [],
      mappings: '',
    };
    const { map, warnings } = await run(
      'export const Broken = () => <div',
      { root: INPUT_DIR },
      { name: 'broken.tsx', inputSourceMap },
    );

    expect(warnings).toHaveLength(1);
    expect(map).toBe(inputSourceMap);
  });

  it('stamps a parseable file and returns a fresh source map', async () => {
    const { error, code, map, warnings } = await run(await read('host-elements.tsx'), {
      root: INPUT_DIR,
    });

    expect(error).toBeNull();
    expect(warnings).toEqual([]);
    expect(code).toContain(PICKER_ATTRIBUTE);
    expect(map).toMatchObject({ sources: ['host-elements.tsx'] });
  });

  it('makes locations relative to the root option', async () => {
    const { code } = await run(await read('host-elements.tsx'), { root: dirname(INPUT_DIR) });

    expect(code).toMatch(new RegExp(`${PICKER_ATTRIBUTE}="input/host-elements\\.tsx:\\d+:\\d+"`));
  });

  it('falls back to rootContext when no root option is given', async () => {
    const { code } = await run(await read('host-elements.tsx'));

    expect(code).toMatch(new RegExp(`${PICKER_ATTRIBUTE}="host-elements\\.tsx:\\d+:\\d+"`));
  });

  it('calls back exactly once', async () => {
    const callback = vi.fn();
    const context = {
      resourcePath: join(INPUT_DIR, 'host-elements.tsx'),
      rootContext: INPUT_DIR,
      getOptions: () => ({ root: INPUT_DIR }),
      emitWarning: () => {},
      async: () => callback,
    };

    stampLoader.call(asContext(context), await read('host-elements.tsx'), undefined);
    await vi.waitFor(() => expect(callback).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
