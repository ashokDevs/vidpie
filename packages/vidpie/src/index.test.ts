import { describe, expect, it } from 'vitest';

import { PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE } from './index.js';

describe('package entry', () => {
  it('exposes the picker attribute names', () => {
    expect(PICKER_ATTRIBUTE).toBe('data-picker-src');
    expect(PICKER_COMPONENT_ATTRIBUTE).toBe('data-picker-component');
  });

  it('uses attribute names that are valid custom data attributes', () => {
    for (const attribute of [PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE]) {
      expect(attribute).toMatch(/^data-[a-z][a-z0-9-]*$/);
    }
  });
});
