import { SPRING_LOCKED_CONTROLS, SPRING_PRESET } from '../core/constants';
import type { TemplateDefinition } from '../core/types';
export const templates: readonly TemplateDefinition[] = [
  { id: 'standard', cssClass: 'template-standard', preset: {}, lockedControls: [], assets: [] },
  {
    id: 'spring',
    cssClass: 'template-spring',
    preset: SPRING_PRESET,
    lockedControls: SPRING_LOCKED_CONTROLS,
    assets: [
      'assets/spring-background.png',
      'assets/spring-number-frame.png',
      'assets/spring-branch-ribbon.png',
    ],
  },
];
export function getTemplate(id: string): TemplateDefinition {
  return templates.find((template) => template.id === id) ?? templates[0]!;
}
