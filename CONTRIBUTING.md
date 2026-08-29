# Contributing to vidpie

Issues and pull requests are welcome.

## Setup

```
git clone https://github.com/ashokDevs/vidpie.git
cd vidpie
pnpm i
pnpm build
```

## Development

```
pnpm dev
```

Run tests before opening a PR:

```
pnpm test
```

## Commit and PR conventions

- Keep commits small and scoped to one change.
- Write commit messages that explain *why*, not just *what*; four sentences max, no bullet points.
- Open a PR against `main`. Describe what changed and why in the description, not just the diff.
- Link the issue a PR resolves, if there is one.

## Code style

- No comments unless they explain a non-obvious *why* (a workaround, a hidden constraint). Don't restate what the code already says.
- No new abstractions or generalization beyond what the change needs.
- Match the existing style in the file you're editing.

## Reporting bugs

Open an issue with steps to reproduce and what you expected instead. If it's a picker-selection bug, include the DOM structure (or a minimal repro) of the element that didn't get picked correctly.
