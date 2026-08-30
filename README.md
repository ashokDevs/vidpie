# vidpie

An installable video editor for React, built on [Remotion](https://remotion.dev).

Click anything in the preview and jump straight to the source that renders it.
That picking workflow is wired in by default, so it's there from the first `install`, with no manual setup.

## Status

Early and unstable. Not yet published.

## Install

(not published yet, this is the intended shape)

```
pnpm create vidpie my-video
cd my-video
pnpm vidpie
```

That's the whole setup.
`pnpm vidpie` opens the editor.

To add vidpie to a project you already have:

```
pnpm add -D vidpie
```

## What vidpie owns, and what it doesn't

The editor is Remotion Studio, and the renderer is Remotion.
Vidpie is not an alternative to either, and it doesn't reimplement them.
What it adds is the picker, plus the packaging that makes the picker work the moment you install: the scaffold, the `vidpie` command, `vidpie.config.ts`, and keeping the versions underneath it in step.
You don't configure Remotion.
A scaffolded project has no `remotion.config.ts` at all, and if you're adding vidpie to a project that already has one, vidpie reads it and keeps your settings rather than replacing them.

Vidpie is also not an authoring API.
Compositions are ordinary React components written against Remotion:

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
```

That import is deliberate.
It means every example, answer, and page in the [Remotion docs](https://remotion.dev/docs) applies to your code as written, with nothing to translate.
The same goes for the editor: it is Studio, so Studio's docs describe it.
Vidpie has no reference of its own to fall out of date.

`remotion`, `react`, and `react-dom` are peer dependencies, so they live in your project and vidpie shares the single copy you already have.
`pnpm create vidpie` puts them in place for you.

Installing does not touch your config.
There is no postinstall step and nothing is written into your project; setup happens when you run `vidpie`.

## Licensing

Remotion is free for individuals and for companies of up to three people, and requires a [company license](https://remotion.pro/license) beyond that.
Using it through vidpie doesn't change that, so check whether it applies to you.

## License

MIT for vidpie's own code, see [LICENSE](./LICENSE).
Remotion is used under its [own license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
