import { describe, expect, it } from 'vitest';
import type { types as t } from '@babel/core';
import { formatLocation } from './location.js';

/**
 * Babel nodes carry far more than `loc`, but `formatLocation` only reads that,
 * so a literal is a more honest fixture here than a real parse.
 */
const nodeAt = (line: number, column: number): t.Node =>
  ({ type: 'JSXOpeningElement', loc: { start: { line, column, index: 0 } } }) as t.Node;

const root = '/repo';

describe('formatLocation', () => {
  it('formats a file inside the root as a relative path', () => {
    const result = formatLocation(nodeAt(12, 0), { root, filename: '/repo/src/Video.tsx' });
    expect(result).toBe('src/Video.tsx:12:1');
  });

  it('counts columns from one, because Babel counts from zero', () => {
    expect(formatLocation(nodeAt(3, 6), { root, filename: '/repo/a.tsx' })).toBe('a.tsx:3:7');
  });

  it('keeps line numbers exactly as Babel reports them', () => {
    expect(formatLocation(nodeAt(1, 0), { root, filename: '/repo/a.tsx' })).toBe('a.tsx:1:1');
  });

  it('falls back to the absolute path when the file is outside the root', () => {
    const result = formatLocation(nodeAt(4, 2), { root, filename: '/elsewhere/b.tsx' });
    expect(result).toBe('/elsewhere/b.tsx:4:3');
  });

  it("reports 'unknown' when Babel supplies no filename", () => {
    expect(formatLocation(nodeAt(9, 4), { root, filename: undefined })).toBe('unknown:9:5');
  });

  it('emits forward slashes so a stamp made on Windows stays readable', () => {
    const result = formatLocation(nodeAt(2, 0), {
      root: 'C:\\repo',
      filename: 'C:\\repo\\src\\Video.tsx',
    });
    expect(result).toBe('src/Video.tsx:2:1');
  });

  it("reports 'unknown' position when the node carries no loc", () => {
    const node = { type: 'JSXOpeningElement' } as t.Node;
    expect(formatLocation(node, { root, filename: '/repo/a.tsx' })).toBe('a.tsx:unknown');
  });
});
