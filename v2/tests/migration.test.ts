import { describe, expect, it } from 'vitest';
import { createStandardDesign } from '../src/core/defaults';
import { migrateCustomization } from '../src/storage/migration';

describe('customization migration', () => {
  it('migrates the legacy V1 shape without trusting unsafe values', () => {
    const result = migrateCustomization({
      app: 'RaiRaiTei Queue Ticket',
      format: 'rairaitei-design',
      version: 1,
      template: 'spring',
      controls: { 'number-size': 9999, 'msg-size': 2, unknown: 100 },
      colors: { 'number-color': '#abc', unsafe: 'url(javascript:bad)' },
      toggles: { 'mascot-tool-toggle': false },
      fonts: { 'number-font-select': "'Times New Roman', serif" },
      mascotImage: 'not-an-image',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.version).toBe(2);
    expect(result.value.design.template).toBe('spring');
    expect(result.value.design.deltas['number-size']).toBe(90);
    expect(result.value.design.deltas['msg-size']).toBe(2);
    expect(result.value.design.colors['number-color']).toBe('#abc');
    expect(result.value.design.colors.unsafe).toBeUndefined();
    expect(result.value.design.toggles.mascot).toBe(false);
    expect(result.value.design.image.mascotDataUri).toBeNull();
  });

  it('deep-merges a V2 file against safe defaults and clamps dimensions', () => {
    const result = migrateCustomization({
      format: 'rairaitei-design',
      version: 2,
      design: {
        dimensions: { coreWidthMm: 500, marginXMm: -4 },
        toggles: { branch: false },
        image: { mascotDataUri: 'data:image/png;base64,AAAA' },
        messageText: '<script>not executed</script>',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.dimensions.coreWidthMm).toBe(297);
    expect(result.value.design.dimensions.coreHeightMm).toBe(79);
    expect(result.value.design.dimensions.marginXMm).toBe(0);
    expect(result.value.design.toggles.branch).toBe(false);
    expect(result.value.design.image.mascotSource).toBe('custom');
    expect(result.value.design.messageText).toContain('<script>');
  });

  it('rejects unsupported formats and keeps defaults available for callers', () => {
    expect(migrateCustomization({ version: 2 })).toEqual({
      ok: false,
      errors: ['Invalid RaiRaiTei design file.'],
    });
    expect(createStandardDesign().dimensions).toEqual({
      coreWidthMm: 44,
      coreHeightMm: 79,
      marginXMm: 1,
      marginYMm: 1,
    });
  });
});
