import { CONTROL_DEFINITIONS } from '../core/constants';
import { createStandardDesign } from '../core/defaults';
import { fail, ok } from '../core/result';
import type {
  ExportedCustomizationV1,
  ExportedCustomizationV2,
  FontStyle,
  FontWeight,
  TicketDesignState,
  TypographySettings,
  ValidationResult,
} from '../core/types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isDataImage = (value: unknown): value is string =>
  typeof value === 'string' && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value);
const validColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-fA-F]{3,8}$/.test(value);
const finiteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function fontWeight(value: unknown, fallback: FontWeight): FontWeight {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return parsed === 400 || parsed === 500 || parsed === 700 || parsed === 900 ? parsed : fallback;
}
function fontStyle(value: unknown, fallback: FontStyle): FontStyle {
  return value === 'italic' || value === 'normal' ? value : fallback;
}
function copyTypography(target: TypographySettings, source: unknown): void {
  if (!isRecord(source)) return;
  if (typeof source.fontFamily === 'string') target.fontFamily = source.fontFamily;
  target.fontWeight = fontWeight(source.fontWeight, target.fontWeight);
  target.fontStyle = fontStyle(source.fontStyle, target.fontStyle);
  if (finiteNumber(source.fontSize)) target.fontSize = clamp(source.fontSize, 1, 250);
  if (validColor(source.color)) target.color = source.color;
  if (validColor(source.strokeColor)) target.strokeColor = source.strokeColor;
  if (finiteNumber(source.strokeWidth)) target.strokeWidth = clamp(source.strokeWidth, 0, 20);
  if (finiteNumber(source.offsetY)) target.offsetY = clamp(source.offsetY, -100, 200);
}
function copyDesignFields(design: TicketDesignState, source: Record<string, unknown>): void {
  if (source.template === 'spring' || source.template === 'standard')
    design.template = source.template;
  if (isRecord(source.dimensions)) {
    if (finiteNumber(source.dimensions.coreWidthMm))
      design.dimensions.coreWidthMm = clamp(source.dimensions.coreWidthMm, 1, 297);
    if (finiteNumber(source.dimensions.coreHeightMm))
      design.dimensions.coreHeightMm = clamp(source.dimensions.coreHeightMm, 1, 297);
    if (finiteNumber(source.dimensions.marginXMm))
      design.dimensions.marginXMm = clamp(source.dimensions.marginXMm, 0, 10);
    if (finiteNumber(source.dimensions.marginYMm))
      design.dimensions.marginYMm = clamp(source.dimensions.marginYMm, 0, 10);
  }
  if (isRecord(source.deltas))
    for (const id of Object.keys(CONTROL_DEFINITIONS)) {
      const value = source.deltas[id];
      if (finiteNumber(value))
        design.deltas[id as keyof typeof design.deltas] = clamp(
          value,
          -CONTROL_DEFINITIONS[id as keyof typeof CONTROL_DEFINITIONS].limit,
          CONTROL_DEFINITIONS[id as keyof typeof CONTROL_DEFINITIONS].limit,
        );
    }
  if (isRecord(source.colors))
    for (const [id, value] of Object.entries(source.colors))
      if (validColor(value)) design.colors[id] = value;
  if (isRecord(source.toggles))
    for (const [id, value] of Object.entries(source.toggles))
      if (id in design.toggles && typeof value === 'boolean')
        design.toggles[id as keyof typeof design.toggles] = value;
  if (isRecord(source.typography)) {
    copyTypography(design.typography.number, source.typography.number);
    copyTypography(design.typography.message, source.typography.message);
    if (isRecord(source.typography.branch)) {
      copyTypography(design.typography.branch, source.typography.branch);
      if (finiteNumber(source.typography.branch.width))
        design.typography.branch.width = clamp(source.typography.branch.width, 10, 100);
      if (finiteNumber(source.typography.branch.padY))
        design.typography.branch.padY = clamp(source.typography.branch.padY, 0, 10);
      if (finiteNumber(source.typography.branch.radius))
        design.typography.branch.radius = clamp(source.typography.branch.radius, 0, 10);
      if (validColor(source.typography.branch.backgroundColor))
        design.typography.branch.backgroundColor = source.typography.branch.backgroundColor;
    }
  }
  if (typeof source.messageText === 'string')
    design.messageText = source.messageText.slice(0, 2000);
  if (typeof source.branchName === 'string') design.branchName = source.branchName.slice(0, 200);
  if (isRecord(source.image)) {
    if (isDataImage(source.image.backgroundDataUri))
      design.image.backgroundDataUri = source.image.backgroundDataUri;
    if (isDataImage(source.image.mascotDataUri)) {
      design.image.mascotDataUri = source.image.mascotDataUri;
      design.image.mascotSource = 'custom';
    }
    if (typeof source.image.removeWhiteBackground === 'boolean')
      design.image.removeWhiteBackground = source.image.removeWhiteBackground;
  }
}
function migrateV1(input: Record<string, unknown>): ExportedCustomizationV2 {
  const legacy = input as unknown as ExportedCustomizationV1;
  const design = createStandardDesign();
  if (legacy.template === 'spring') design.template = 'spring';
  if (isRecord(legacy.controls)) {
    for (const [id, value] of Object.entries(legacy.controls)) {
      if (id === 'core-width-input' && finiteNumber(value))
        design.dimensions.coreWidthMm = clamp(value, 1, 297);
      if (id === 'core-height-input' && finiteNumber(value))
        design.dimensions.coreHeightMm = clamp(value, 1, 297);
      const definition = CONTROL_DEFINITIONS[id as keyof typeof CONTROL_DEFINITIONS];
      if (definition && finiteNumber(value))
        design.deltas[id as keyof typeof design.deltas] = clamp(
          value,
          -definition.limit,
          definition.limit,
        );
    }
  }
  if (isRecord(legacy.colors))
    for (const [id, value] of Object.entries(legacy.colors))
      if (validColor(value)) design.colors[id] = value;
  if (isRecord(legacy.toggles))
    for (const [id, value] of Object.entries(legacy.toggles)) {
      const key = id.replace(/-tool-toggle$/, '');
      if (key in design.toggles && typeof value === 'boolean')
        design.toggles[key as keyof typeof design.toggles] = value;
    }
  if (isRecord(legacy.fonts)) {
    if (typeof legacy.fonts['number-font-select'] === 'string')
      design.typography.number.fontFamily = legacy.fonts['number-font-select'];
    if (typeof legacy.fonts['msg-font'] === 'string')
      design.typography.message.fontFamily = legacy.fonts['msg-font'];
    if (typeof legacy.fonts['branch-font'] === 'string')
      design.typography.branch.fontFamily = legacy.fonts['branch-font'];
  }
  if (isRecord(legacy.mascots)) {
    design.typography.message.fontWeight = fontWeight(
      legacy.mascots['msg-weight'],
      design.typography.message.fontWeight,
    );
    design.typography.message.fontStyle = fontStyle(
      legacy.mascots['msg-style'],
      design.typography.message.fontStyle,
    );
    design.typography.branch.fontWeight = fontWeight(
      legacy.mascots['branch-weight'],
      design.typography.branch.fontWeight,
    );
    design.typography.branch.fontStyle = fontStyle(
      legacy.mascots['branch-style'],
      design.typography.branch.fontStyle,
    );
  }
  if (isDataImage(legacy.backgroundImage)) design.image.backgroundDataUri = legacy.backgroundImage;
  if (isDataImage(legacy.mascotImage)) {
    design.image.mascotDataUri = legacy.mascotImage;
    design.image.mascotSource = 'custom';
  }
  return {
    app: 'RaiRaiTei Queue Ticket',
    format: 'rairaitei-design',
    version: 2,
    savedAt: typeof legacy.savedAt === 'string' ? legacy.savedAt : new Date().toISOString(),
    design,
  };
}

export function migrateCustomization(input: unknown): ValidationResult<ExportedCustomizationV2> {
  if (
    !isRecord(input) ||
    input.format !== 'rairaitei-design' ||
    (input.version !== 1 && input.version !== 2)
  )
    return fail('Invalid RaiRaiTei design file.');
  if (input.version === 1) return ok(migrateV1(input));
  if (!isRecord(input.design)) return fail('Missing V2 design.');
  const design = createStandardDesign();
  copyDesignFields(design, input.design);
  return ok({
    app: 'RaiRaiTei Queue Ticket',
    format: 'rairaitei-design',
    version: 2,
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : new Date().toISOString(),
    design,
  });
}

export { isDataImage };
