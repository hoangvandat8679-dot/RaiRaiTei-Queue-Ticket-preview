import { describe, expect, it } from 'vitest';

import { boot, requireApplicationRoot } from '../src/app/boot';

describe('V2 boot', () => {
  it('boots once when the application root exists', () => {
    document.body.innerHTML = '<main id="app-root"></main>';
    const root = requireApplicationRoot(document);

    expect(boot(root).mounted).toBe(true);
    expect(root.dataset.v2Booted).toBe('true');
    expect(root.querySelector('.v2-ticket')).not.toBeNull();
    expect(root.querySelectorAll('[data-control]').length).toBe(25);
    expect(root.querySelectorAll('input[type="color"]').length).toBe(9);
    expect(root.querySelectorAll('[data-toggle]').length).toBe(6);
  });

  it('applies spring art defaults and keeps the background toggle effective', () => {
    document.body.innerHTML = '<main id="app-root"></main>';
    const root = requireApplicationRoot(document);
    boot(root);

    const springButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('春'),
    );
    expect(springButton).toBeDefined();
    springButton?.click();

    const ticket = root.querySelector<HTMLElement>('.v2-ticket');
    const backgroundLayer = root.querySelector<HTMLElement>('.v2-background-layer');
    const backgroundToggle = root.querySelector<HTMLInputElement>('[data-toggle="background"]');
    expect(ticket?.classList.contains('spring')).toBe(true);
    expect(ticket?.style.getPropertyValue('--number-offset-y')).toBe('0.5mm');
    expect(ticket?.style.getPropertyValue('--background-layer-image')).toContain(
      'spring-background.png',
    );

    expect(backgroundToggle).not.toBeNull();
    if (!backgroundToggle) return;
    backgroundToggle.checked = false;
    backgroundToggle.dispatchEvent(new Event('change', { bubbles: true }));
    expect(backgroundLayer?.style.display).toBe('none');
    expect(ticket?.style.getPropertyValue('--background-layer-display')).toBe('none');
  });

  it('fails with a clear error when the root is missing', () => {
    document.body.replaceChildren();

    expect(() => requireApplicationRoot(document)).toThrow(
      'V2 application root #app-root was not found.',
    );
  });

  it('is idempotent when boot is called again for the same root', () => {
    document.body.innerHTML = '<main id="app-root"></main>';
    const root = requireApplicationRoot(document);

    expect(boot(root).mounted).toBe(true);
    expect(boot(root).mounted).toBe(false);
  });
});
