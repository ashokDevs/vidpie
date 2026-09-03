import type { types as t } from '@babel/core';
import path from 'node:path';

export interface LocationOptions {
  /** Directory that stamped paths are made relative to. */
  root: string;
  /** Absolute path of the file being transformed. */
  filename: string | undefined;
}

/** Rewrites Windows separators so a stamp reads the same on every host. */
const toPosix = (value: string): string => value.replaceAll('\\', '/');

/**
 * Formats a node's position as the `file:line:column` string that goes into
 * {@link PICKER_ATTRIBUTE}.
 *
 * Columns are 1-based here while Babel's are 0-based, because every editor and
 * every agent that reads this string counts from one.
 */
export const formatLocation = (node: t.Node, options: LocationOptions): string => {
  const file = formatFile(options);
  const start = node.loc?.start;
  const position = start ? `${start.line}:${start.column + 1}` : 'unknown';

  return `${file}:${position}`;
};

/**
 * Separators are normalised before `path.relative`, not after: a Windows path
 * handed to the POSIX implementation is one opaque segment, so relativising it
 * first produces a `..` escape rather than the sub-path we want.
 */
const formatFile = ({ root, filename }: LocationOptions): string => {
  if (!filename) return 'unknown';

  const absolute = toPosix(filename);
  const relative = path.posix.relative(toPosix(root), absolute);
  const outsideRoot = relative === '' || relative.startsWith('../');

  return outsideRoot ? absolute : relative;
};
