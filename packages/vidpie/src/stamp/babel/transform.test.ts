import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE } from '../constants.js';
import { stampSource } from './transform.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = join(HERE, '__fixtures__', 'input');
const EXPECTED_DIR = join(HERE, '__fixtures__', 'expected');

const fixtures = (await readdir(INPUT_DIR)).filter((name) => name.endsWith('.tsx')).sort();

const read = (name: string): Promise<string> => readFile(join(INPUT_DIR, name), 'utf8');

const stamp = async (source: string, name: string, root = INPUT_DIR): Promise<string> => {
  const result = await stampSource(source, { filename: join(INPUT_DIR, name), root });
  return result.code;
};

const stampFixture = async (name: string): Promise<string> => stamp(await read(name), name);

/** Every value of one attribute, in source order. */
const valuesOf = (code: string, attribute: string): string[] =>
  [...code.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))].map((match) => match[1] ?? '');

describe('stampSource fixtures', () => {
  // Snapshots are written on first green run. Read the diff before accepting one.
  it.each(fixtures)('%s', async (name) => {
    await expect(await stampFixture(name)).toMatchFileSnapshot(join(EXPECTED_DIR, name));
  });
});

describe('stamp contract', () => {
  it('stamps every host element with a location', async () => {
    const locations = valuesOf(await stampFixture('host-elements.tsx'), PICKER_ATTRIBUTE);

    expect(locations).toHaveLength(5);
    for (const location of locations) {
      expect(location).toMatch(/^host-elements\.tsx:\d+:\d+$/);
    }
  });

  it('wraps component call sites rather than passing them a prop', async () => {
    const code = await stampFixture('nested-components.tsx');

    expect(code).toMatch(/<Inner\s*\/>/);
    expect(code).not.toMatch(/<Inner[^>]*data-picker/);
    expect(code).toMatch(
      new RegExp(
        `<div [^>]*${PICKER_COMPONENT_ATTRIBUTE}="Inner"[^>]*style=\\{\\{\\s*display: "contents"`,
      ),
    );
  });

  it('resolves a dotted call site to its full name', async () => {
    const components = valuesOf(
      await stampFixture('member-expressions.tsx'),
      PICKER_COMPONENT_ATTRIBUTE,
    );

    expect(components).toContain('Layout.Row');
    expect(components).not.toContain('motion.div');
  });

  it('does not wrap the components in SKIP_COMPONENTS', async () => {
    const code = await stampFixture('skip-components.tsx');

    expect(valuesOf(code, PICKER_COMPONENT_ATTRIBUTE)).toEqual([]);
    expect(code).toContain('<Folder name="scenes">');
  });

  it('makes an OffthreadVideo pickable', async () => {
    const components = valuesOf(
      await stampFixture('remotion-primitives.tsx'),
      PICKER_COMPONENT_ATTRIBUTE,
    );

    expect(components).toEqual(['AbsoluteFill', 'Sequence', 'OffthreadVideo']);
  });

  it('keeps line numbers stable', async () => {
    for (const name of fixtures) {
      const lines = (await stampFixture(name)).split('\n');

      lines.forEach((line, index) => {
        for (const match of line.matchAll(new RegExp(`${PICKER_ATTRIBUTE}="([^"]*)"`, 'g'))) {
          const location = match[1] ?? '';
          const declared = Number(location.split(':')[1]);
          expect(`${name} ${location} sits on line ${index + 1}`).toBe(
            `${name} ${location} sits on line ${declared}`,
          );
        }
      });
    }
  });

  it('leaves TypeScript syntax untouched', async () => {
    const code = await stampFixture('type-assertions.tsx');

    expect(code).toContain('as {');
    expect(code).toContain('width: number');
    expect(code).toContain('const raw: unknown');
  });

  it('is idempotent', async () => {
    for (const name of fixtures) {
      const once = await stampFixture(name);
      expect(await stamp(once, name)).toBe(once);
    }
  });

  it('makes locations relative to the root it was given', async () => {
    const locations = valuesOf(
      await stamp(await read('host-elements.tsx'), 'host-elements.tsx', dirname(INPUT_DIR)),
      PICKER_ATTRIBUTE,
    );

    expect(locations.length).toBeGreaterThan(0);
    for (const location of locations) {
      expect(location).toMatch(/^input\/host-elements\.tsx:\d+:\d+$/);
    }
  });

  it('lets a parse error escape', async () => {
    await expect(stamp('export const Broken = () => <div', 'broken.tsx')).rejects.toThrow();
  });

  it('returns a source map that points back at the input', async () => {
    const result = await stampSource(await read('host-elements.tsx'), {
      filename: join(INPUT_DIR, 'host-elements.tsx'),
      root: INPUT_DIR,
    });

    expect(result.map).toBeTruthy();
    expect(result.map).toMatchObject({ sources: ['host-elements.tsx'] });
  });
});

describe('empty input', () => {
  it('falls back to the input source map when Babel returns no code', async () => {
    const inputSourceMap = {
      version: 3,
      file: 'Scene.tsx',
      sources: ['Scene.tsx'],
      names: [],
      mappings: '',
    };

    const result = await stampSource('', {
      filename: join(INPUT_DIR, 'empty.tsx'),
      root: INPUT_DIR,
      inputSourceMap,
    });

    expect(result.code).toBe('');
    expect(result.map).toBe(inputSourceMap);
  });
});
