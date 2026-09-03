import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { transformSync, types as t } from '@babel/core';
import { describe, expect, it } from 'vitest';

import { PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE } from '../constants.js';
import { buildWrapper, stampPlugin } from './plugin.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '__fixtures__', 'input');

/**
 * Drives Babel directly rather than through `stampSource`, so a failure here is
 * a failure of the visitors and not of the transform's option set.
 */
const stamp = (source: string, filename = 'Scene.tsx'): string => {
  const result = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename: join(ROOT, filename),
    retainLines: true,
    parserOpts: { plugins: ['jsx', 'typescript'] },
    plugins: [[stampPlugin, { root: ROOT }]],
  });

  if (!result?.code) throw new Error('transform produced no code');
  return result.code;
};

const KITCHEN_SINK = 'remotion-kitchen-sink.tsx';
const stampFixture = (name: string): string => stamp(readFileSync(join(ROOT, name), 'utf8'), name);

const matchAll = (code: string, attribute: string): string[] =>
  [...code.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))].map((match) => match[1] ?? '');

/** Every stamped location, in source order. Wrappers carry one too. */
const locations = (code: string): string[] => matchAll(code, PICKER_ATTRIBUTE);

/** Every component name captured on a wrapper, in source order. */
const components = (code: string): string[] => matchAll(code, PICKER_COMPONENT_ATTRIBUTE);

/**
 * The expected values were computed from the parser, not counted by hand, so
 * they say what a real Remotion project gets rather than a contrived snippet.
 */
describe('a real Remotion composition', () => {
  it('wraps every component call site that is safe to wrap', () => {
    expect(components(stampFixture(KITCHEN_SINK))).toEqual([
      'Solid',
      'Img',
      'AbsoluteFill',
      'Backdrop',
      'Sequence',
      'OffthreadVideo',
      'Series',
      'Title',
      'Video',
      'TransitionSeries',
      'Title',
      'Title',
      'AbsoluteFill',
      'Reel',
      'Chapters',
      'Transitions',
      'Fragment',
      'Loop',
      'Title',
      'IFrame',
      'Audio',
      'Experimental.Clipper',
      'Experimental.Null',
    ]);
  });

  it('wraps nothing in SKIP_COMPONENTS', () => {
    const wrapped = components(stampFixture(KITCHEN_SINK));

    // The Series members are the dangerous half: their parent compares
    // `child.type` and throws, so a wrapper breaks the render, not just picking.
    for (const skipped of [
      'Composition',
      'Still',
      'Folder',
      'Series.Sequence',
      'TransitionSeries.Sequence',
      'TransitionSeries.Transition',
    ]) {
      expect(wrapped).not.toContain(skipped);
    }
  });

  it('wraps a member expression that is safe, next to ones that are not', () => {
    // Both are member expressions in the same file, so the decision cannot be
    // made on node shape alone.
    const wrapped = components(stampFixture(KITCHEN_SINK));

    expect(wrapped).toContain('Experimental.Clipper');
    expect(wrapped).toContain('Experimental.Null');
    expect(wrapped).not.toContain('Series.Sequence');
  });

  it('stamps the five host elements and nothing else without a wrapper', () => {
    // div, h1, p, span, img. Everything else stamped is a wrapper.
    const code = stampFixture(KITCHEN_SINK);

    expect(locations(code)).toHaveLength(5 + components(code).length);
  });

  it('keeps every stamp on the line it names', () => {
    // retainLines makes this true; wrapping threatens it, since each wrapper is
    // a node that did not exist in the input.
    const code = stampFixture(KITCHEN_SINK);

    const wrong = code
      .split('\n')
      .flatMap((text, index) =>
        [...text.matchAll(new RegExp(`${PICKER_ATTRIBUTE}="[^:]*:(\\d+):`, 'g'))].map((match) => ({
          says: Number(match[1]),
          sitsOn: index + 1,
        })),
      )
      .filter((stampedLine) => stampedLine.says !== stampedLine.sitsOn);

    expect(wrong).toEqual([]);
  });

  it('names the file relative to the root', () => {
    for (const location of locations(stampFixture(KITCHEN_SINK))) {
      expect(location).toMatch(/^remotion-kitchen-sink\.tsx:\d+:\d+$/);
    }
  });

  it('is a no-op when run again over its own output', () => {
    // Webpack can run a loader on one module more than once.
    const once = stampFixture(KITCHEN_SINK);

    expect(locations(once).length).toBeGreaterThan(0);
    expect(stamp(once, KITCHEN_SINK)).toBe(once);
  });

  it('leaves the TypeScript alone', () => {
    // esbuild does the real compilation after this, so types must survive
    // verbatim. A parser misconfigured for .tsx mangles `satisfies` and `as`.
    const code = stampFixture(KITCHEN_SINK);

    expect(code).toContain('satisfies');
    expect(code).toContain('as React.CSSProperties');
    expect(code).toContain('interface Clip');
  });
});

/** Cases a realistic file cannot express, as the smallest snippet that shows them. */
describe('edge cases', () => {
  it('does not put the location attribute on the component itself', () => {
    // A `data-` prop handed to a component is forwarded unpredictably or
    // dropped, which is the whole reason wrappers exist.
    const code = stamp('export const A = () => <OffthreadVideo src="a.mp4" />;\n');

    expect(components(code)).toEqual(['OffthreadVideo']);
    expect(code).toMatch(new RegExp(`${PICKER_ATTRIBUTE}="[^"]*"[^>]*>\\s*<OffthreadVideo`));
  });

  it('gives the wrapper the call site position, not the definition', () => {
    const code = stamp(
      ['const Title = () => <h1 />;', 'export const A = () => <Title />;\n'].join('\n'),
    );

    expect(locations(code)).toEqual(['Scene.tsx:1:21', 'Scene.tsx:2:24']);
  });

  it('puts the attribute after any spread, because React takes the last one', () => {
    // An attribute emitted before a spread carrying the same key is silently
    // overwritten, and the build still succeeds with the wrong source.
    const code = stamp('export const A = (props) => <div {...props} />;\n');

    expect(code.indexOf('...props')).toBeLessThan(code.indexOf(PICKER_ATTRIBUTE));
  });

  it('leaves an element that is already stamped alone', () => {
    // The unstamped sibling stops a do-nothing plugin from satisfying this.
    const code = stamp(
      [
        'export const A = () => (',
        `  <div ${PICKER_ATTRIBUTE}="kept.tsx:9:9">`,
        '    <span />',
        '  </div>',
        ');\n',
      ].join('\n'),
    );

    expect(locations(code)).toEqual(['kept.tsx:9:9', 'Scene.tsx:3:5']);
  });

  it('skips a node the parser gave no position', () => {
    // A location that looks real and resolves nowhere is worse than none. Only
    // the <em> loses its position, so the <span> proves the plugin ran.
    const code = transformSync('export const A = () => <span><em /></span>;\n', {
      babelrc: false,
      configFile: false,
      filename: join(ROOT, 'Scene.tsx'),
      parserOpts: { plugins: ['jsx', 'typescript'] },
      plugins: [
        {
          name: 'strip-loc',
          visitor: {
            JSXOpeningElement(path) {
              if (path.node.name.type === 'JSXIdentifier' && path.node.name.name === 'em') {
                path.node.loc = null;
              }
            },
          },
        },
        [stampPlugin, { root: ROOT }],
      ],
    })?.code;

    expect(locations(code ?? '')).toEqual(['Scene.tsx:1:24']);
  });

  it('does not wrap a fragment but still stamps inside it', () => {
    const code = stamp(
      ['export const A = () => (', '  <>', '    <li />', '  </>', ');\n'].join('\n'),
    );

    expect(components(code)).toEqual([]);
    expect(locations(code)).toEqual(['Scene.tsx:3:5']);
  });

  it('wraps every call site of one component, not just the first', () => {
    // The handled-node record is keyed on object identity. One keyed on the name
    // would wrap the first and silently skip the rest.
    const code = stamp(
      [
        'export const A = () => (',
        '  <AbsoluteFill>',
        '    <Sequence from={0} />',
        '    <Sequence from={60} />',
        '  </AbsoluteFill>',
        ');\n',
      ].join('\n'),
    );

    expect(components(code)).toEqual(['AbsoluteFill', 'Sequence', 'Sequence']);
    expect(locations(code)).toEqual(['Scene.tsx:2:3', 'Scene.tsx:3:5', 'Scene.tsx:4:5']);
  });
});

/**
 * Asserted against the tree rather than printed text, so a failure points at the
 * node that is wrong and no `@babel/generator` dependency is needed.
 */
describe('buildWrapper', () => {
  const element = (name: string): t.JSXElement =>
    t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier(name), [], true), null, [], true);

  /** Attribute names in the order they will be printed. */
  const names = (wrapper: t.JSXElement): (string | null)[] =>
    wrapper.openingElement.attributes.map((attribute) =>
      attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier'
        ? attribute.name.name
        : null,
    );

  const valueOf = (wrapper: t.JSXElement, name: string): t.JSXAttribute['value'] =>
    wrapper.openingElement.attributes.find(
      (attribute): attribute is t.JSXAttribute =>
        attribute.type === 'JSXAttribute' &&
        attribute.name.type === 'JSXIdentifier' &&
        attribute.name.name === name,
    )?.value ?? null;

  it('puts the original element inside a div without copying it', () => {
    // The WeakSet is keyed on the object, so a clone would be a different node
    // and the traversal would wrap it a second time.
    const original = element('Sequence');
    const wrapper = buildWrapper(original, 'Sequence', 'Scene.tsx:2:3');

    expect(wrapper.openingElement.name).toMatchObject({ type: 'JSXIdentifier', name: 'div' });
    expect(wrapper.openingElement.selfClosing).toBe(false);
    expect(wrapper.children).toHaveLength(1);
    expect(wrapper.children[0]).toBe(original);
  });

  it('emits the two picker attributes before style', () => {
    // This is the order React sees, and the last writer of a key wins.
    const wrapper = buildWrapper(element('Sequence'), 'Sequence', 'Scene.tsx:2:3');

    expect(names(wrapper)).toEqual([PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE, 'style']);
  });

  it('carries a dotted component name through as one string', () => {
    // A JSXMemberExpression in source, flattened before it gets here, so nothing
    // downstream has to re-join it.
    const wrapper = buildWrapper(
      element('Experimental'),
      'Experimental.Clipper',
      'Scene.tsx:124:7',
    );

    expect(valueOf(wrapper, PICKER_ATTRIBUTE)).toMatchObject({
      type: 'StringLiteral',
      value: 'Scene.tsx:124:7',
    });
    expect(valueOf(wrapper, PICKER_COMPONENT_ATTRIBUTE)).toMatchObject({
      type: 'StringLiteral',
      value: 'Experimental.Clipper',
    });
  });

  it('makes style an expression container, not a string', () => {
    // Build only the inner brace pair and this prints style="[object Object]";
    // build neither and React gets a string where it requires an object.
    const wrapper = buildWrapper(element('Sequence'), 'Sequence', 'Scene.tsx:2:3');

    expect(valueOf(wrapper, 'style')).toMatchObject({
      type: 'JSXExpressionContainer',
      expression: {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'display' },
            value: { type: 'StringLiteral', value: 'contents' },
          },
        ],
      },
    });
  });

  it('gives the opening and closing tags their own name node', () => {
    // One node object appearing twice is a shape Babel does not expect.
    const wrapper = buildWrapper(element('Sequence'), 'Sequence', 'Scene.tsx:2:3');

    expect(wrapper.closingElement?.name).toMatchObject({ type: 'JSXIdentifier', name: 'div' });
    expect(wrapper.closingElement?.name).not.toBe(wrapper.openingElement.name);
  });

  it('claims no source position of its own', () => {
    // The visitor copies the original's position on; retainLines has nothing to
    // anchor until it does.
    const wrapper = buildWrapper(element('Sequence'), 'Sequence', 'Scene.tsx:2:3');

    expect(wrapper.loc).toBeUndefined();
    expect(wrapper.openingElement.loc).toBeUndefined();
  });
});
