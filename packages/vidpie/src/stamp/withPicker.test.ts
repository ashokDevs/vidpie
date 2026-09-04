import { join, sep } from 'node:path';

import type { Configuration, RuleSetRule } from 'webpack';
import { describe, expect, it } from 'vitest';

import { withPicker } from './withPicker.js';

/** The stamp rule is always the last one, since withPicker only appends. */
const stampRule = (config: Configuration): RuleSetRule => {
  const rules = config.module?.rules ?? [];
  const last = rules[rules.length - 1];

  expect(last).toBeTypeOf('object');

  return last as RuleSetRule;
};

const loaderOf = (rule: RuleSetRule): { loader?: string; options?: unknown } => {
  expect(Array.isArray(rule.use)).toBe(true);

  return (rule.use as { loader?: string; options?: unknown }[])[0]!;
};

describe('withPicker', () => {
  it('appends a rule instead of replacing the config', () => {
    // This composes on top of the user's own `overrideWebpackConfig`, so
    // replacing anything silently drops their settings with no error.
    const userRule: RuleSetRule = { test: /\.css$/, use: ['css-loader'] };
    const userPlugin = { apply: () => {} };
    const input: Configuration = {
      mode: 'development',
      module: { rules: [userRule] },
      plugins: [userPlugin],
      resolve: { alias: { '@': '/src' } },
    };

    const output = withPicker({ root: '/project' })(input);

    expect(output.module?.rules).toHaveLength(2);
    expect(output.module?.rules?.[0]).toBe(userRule);
    expect(output.plugins).toEqual([userPlugin]);
    expect(output.resolve).toEqual({ alias: { '@': '/src' } });
    expect(output.mode).toBe('development');
  });

  it('leaves the config it was given untouched', () => {
    // Remotion may reuse the object, so the override has to be a pure copy.
    const input: Configuration = { module: { rules: [{ test: /\.css$/ }] } };

    withPicker()(input);

    expect(input.module?.rules).toHaveLength(1);
  });

  it('registers the loader with enforce pre', () => {
    // Without `enforce: 'pre'` esbuild-loader has already stripped the types
    // and rewritten the JSX, and the plugin sees nothing to stamp. This is the
    // single most load-bearing line in the rule.
    const rule = stampRule(withPicker({ root: '/project' })({}));

    expect(rule.enforce).toBe('pre');
    expect(rule.test).toEqual(/\.(tsx|jsx)$/);
    expect(rule.exclude).toEqual(/node_modules/);
  });

  it('stamps tsx and jsx but not ts, js or node_modules', () => {
    const rule = stampRule(withPicker()({}));
    const test = rule.test as RegExp;

    expect(test.test('/project/src/Scene.tsx')).toBe(true);
    expect(test.test('/project/src/Scene.jsx')).toBe(true);
    expect(test.test('/project/src/util.ts')).toBe(false);
    expect(test.test('/project/src/util.js')).toBe(false);
    expect((rule.exclude as RegExp).test('/project/node_modules/remotion/x.tsx')).toBe(true);
  });

  it('tolerates a config with no module or no rules', () => {
    // Both are optional in webpack's types.
    expect(withPicker()({}).module?.rules).toHaveLength(1);
    expect(withPicker()({ module: {} }).module?.rules).toHaveLength(1);
    expect(withPicker()({ module: { rules: [] } }).module?.rules).toHaveLength(1);
  });

  it('points the loader at built output rather than source', () => {
    // Resolving from `src/` works in this repo and breaks for every installed
    // user, who only ever receives `dist/`.
    const { loader } = loaderOf(stampRule(withPicker()({})));

    expect(loader?.endsWith(join('dist', 'stamp', 'loader.cjs'))).toBe(true);
    expect(loader).not.toContain(`${sep}src${sep}`);
  });

  it('passes the root option through to the loader', () => {
    const { options } = loaderOf(stampRule(withPicker({ root: '/project' })({})));

    expect(options).toEqual({ root: '/project' });
  });

  it('defaults the root to the current working directory', () => {
    const { options } = loaderOf(stampRule(withPicker()({})));

    expect(options).toEqual({ root: process.cwd() });
  });
});
