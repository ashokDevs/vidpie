export const PICKER_ATTRIBUTE = 'data-picker-src';

export const PICKER_COMPONENT_ATTRIBUTE = 'data-picker-component';

export const SKIP_COMPONENTS: ReadonlySet<string> = new Set([
  'Composition',
  'Still',
  'Folder',
  'Series.Sequence',
  'TransitionSeries.Sequence',
  'TransitionSeries.Transition',
]);
