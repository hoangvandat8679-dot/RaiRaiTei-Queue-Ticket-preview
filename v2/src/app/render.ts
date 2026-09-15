import type { AppState, Store, TicketDesignState } from '../core/types';
import { CONTROL_DEFINITIONS, CONTROL_IDS, getControlBase } from '../core/constants';
import { createStandardDesign } from '../core/defaults';
import { calculateLayout, parseCustomRange, resolvedTicketDimensions } from '../ticket/geometry';
import { DesignHistory } from '../state/history';
import { getTemplate } from '../templates/registry';
import type { I18n } from '../i18n/i18n';
import { migrateCustomization } from '../storage/migration';
import { buildMobilePdf } from '../print/mobilePdfAdapter';
import { buildDesktopPrint } from '../print/desktopFrameAdapter';
import { MAX_IMPORT_BYTES } from '../core/constants';
import { loadDefaultMascot, processMascotDataUri, readImageFile } from '../images/imageLoader';

const COLOR_DEFAULTS: Record<string, string> = {
  'bg-color': '#fcd116',
  'number-color': '#e60012',
  'number-bg-color': '#ffffff',
  'number-border-color': '#e60012',
  'msg-color': '#111111',
  'msg-stroke-c': '#ffffff',
  'branch-color': '#ffffff',
  'branch-bg': '#e60012',
  'branch-stroke-c': '#000000',
};
const FONT_OPTIONS = [
  "'Impact', sans-serif",
  "'Arial Black', sans-serif",
  "'Times New Roman', serif",
  "'Noto Sans JP', sans-serif",
];

function button(text: string, className = 'v2-button'): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = text;
  return element;
}
function fieldLabel(label: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  wrapper.textContent = label;
  wrapper.append(control);
  return wrapper;
}
function textInput(id: string, value: string, type = 'text'): HTMLInputElement {
  const control = document.createElement('input');
  control.id = id;
  control.type = type;
  control.value = value;
  return control;
}
function selectInput(id: string, options: readonly string[], value: string): HTMLSelectElement {
  const control = document.createElement('select');
  control.id = id;
  options.forEach((option) => {
    const item = document.createElement('option');
    item.value = option;
    item.textContent = option;
    item.selected = option === value;
    control.append(item);
  });
  return control;
}
function section(title: string): HTMLElement {
  const element = document.createElement('section');
  element.className = 'control-group';
  const heading = document.createElement('h2');
  heading.textContent = title;
  element.append(heading);
  return element;
}
function checkbox(id: string, checked: boolean): HTMLInputElement {
  const control = document.createElement('input');
  control.id = id;
  control.type = 'checkbox';
  control.checked = checked;
  return control;
}

export function renderApp(root: HTMLElement, store: Store<AppState>, i18n: I18n): void {
  const history = new DesignHistory(store.getState().design);
  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.setAttribute('role', 'dialog');
  notice.setAttribute('aria-modal', 'true');
  const noticeCard = document.createElement('div');
  noticeCard.className = 'notice-card';
  const noticeText = document.createElement('p');
  const noticeClose = button(i18n.t('appNoticeOk'), 'v2-button primary');
  noticeCard.append(noticeText, noticeClose);
  notice.append(noticeCard);
  noticeClose.addEventListener('click', () => notice.classList.remove('open'));
  const showNotice = (message: string) => {
    noticeText.textContent = message;
    notice.classList.add('open');
  };

  const header = document.createElement('header');
  header.className = 'v2-header';
  const title = document.createElement('h1');
  const actions = document.createElement('div');
  actions.className = 'v2-actions';
  const languageButton = button('JP', 'v2-button desktop-action');
  const undoButton = button('↶', 'v2-button desktop-action');
  const redoButton = button('↷', 'v2-button desktop-action');
  const printButton = button(i18n.t('print'), 'v2-button primary');
  actions.append(languageButton, undoButton, redoButton, printButton);
  header.append(title, actions);
  const sidebar = document.createElement('aside');
  sidebar.className = 'v2-sidebar';
  const tabs = document.createElement('nav');
  tabs.className = 'panel-tabs nav-row';
  const designTab = button(i18n.t('templates'), 'v2-button tab-button design-tab');
  const settingsTab = button(i18n.t('settings'), 'v2-button tab-button settings-tab');
  const savedTab = button(i18n.t('saved'), 'v2-button tab-button saved-tab');
  const backButton = button(`← ${i18n.t('back')}`, 'v2-button back-button');
  tabs.append(designTab, settingsTab, savedTab, backButton);
  sidebar.append(tabs);

  const templateGroup = section(i18n.t('templates'));
  const springButton = button(`${i18n.t('spring')} — ${i18n.t('springDescription')}`);
  const standardButton = button(i18n.t('standard'));
  templateGroup.append(springButton, standardButton);
  const controlsGroup = section(i18n.t('controls'));
  const sizeFields = document.createElement('div');
  sizeFields.className = 'field-inline';
  const coreWidth = textInput(
    'core-width',
    String(store.getState().design.dimensions.coreWidthMm),
    'number',
  );
  const coreHeight = textInput(
    'core-height',
    String(store.getState().design.dimensions.coreHeightMm),
    'number',
  );
  sizeFields.append(
    fieldLabel(i18n.t('coreWidth'), coreWidth),
    fieldLabel(i18n.t('coreHeight'), coreHeight),
  );
  controlsGroup.append(sizeFields);
  const controlElements = new Map<string, HTMLInputElement>();
  for (const id of CONTROL_IDS) {
    const definition = CONTROL_DEFINITIONS[id];
    const range = textInput(id, String(store.getState().design.deltas[id]), 'range');
    range.min = String(-definition.limit);
    range.max = String(definition.limit);
    range.step = '0.1';
    range.dataset.control = id;
    controlElements.set(id, range);
    const output = document.createElement('output');
    output.id = `${id}-output`;
    output.textContent = '0';
    const wrapper = document.createElement('div');
    wrapper.className = 'range-row';
    wrapper.append(range, output);
    controlsGroup.append(fieldLabel(id, wrapper));
  }
  const colorsGroup = section(i18n.t('colors'));
  const colorElements = new Map<string, HTMLInputElement>();
  for (const [id, value] of Object.entries(COLOR_DEFAULTS)) {
    const color = textInput(id, store.getState().design.colors[id] ?? value, 'color');
    color.dataset.color = id;
    colorElements.set(id, color);
    colorsGroup.append(fieldLabel(id, color));
  }
  const togglesGroup = section('Visibility');
  for (const [id, checked] of Object.entries(store.getState().design.toggles)) {
    const toggle = checkbox(`toggle-${id}`, checked);
    toggle.dataset.toggle = id;
    togglesGroup.append(fieldLabel(id, toggle));
  }
  const typographyGroup = section('Typography');
  const numberFont = selectInput(
    'number-font',
    FONT_OPTIONS,
    store.getState().design.typography.number.fontFamily,
  );
  const messageFont = selectInput(
    'message-font',
    ["'Noto Sans JP', sans-serif"],
    store.getState().design.typography.message.fontFamily,
  );
  const branchFont = selectInput(
    'branch-font',
    ["'Noto Sans JP', sans-serif"],
    store.getState().design.typography.branch.fontFamily,
  );
  typographyGroup.append(
    fieldLabel('Number font', numberFont),
    fieldLabel('Message font', messageFont),
    fieldLabel('Branch font', branchFont),
  );
  const textGroup = section('Content');
  const branchName = textInput('branch-name', store.getState().design.branchName);
  const messageText = document.createElement('textarea');
  messageText.id = 'message-text';
  messageText.value = store.getState().design.messageText;
  textGroup.append(
    fieldLabel(i18n.t('branchName'), branchName),
    fieldLabel(i18n.t('messageText'), messageText),
  );
  const imageGroup = section(i18n.t('images'));
  const bgFile = textInput('background-file', '', 'file');
  bgFile.accept = 'image/png,image/jpeg,image/webp';
  const mascotFile = textInput('mascot-file', '', 'file');
  mascotFile.accept = 'image/png,image/jpeg,image/webp';
  const removeWhite = checkbox('remove-white', store.getState().design.image.removeWhiteBackground);
  imageGroup.append(
    fieldLabel(i18n.t('background'), bgFile),
    fieldLabel('Mascot', mascotFile),
    fieldLabel(i18n.t('removeWhite'), removeWhite),
  );
  const printGroup = section('Print');
  const mode = document.createElement('select');
  mode.id = 'print-mode';
  const printModes: readonly [string, string][] = [
    ['sequential', i18n.t('sequential')],
    ['custom', i18n.t('custom')],
  ];
  printModes.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    mode.append(option);
  });
  const quantity = textInput('print-quantity', String(store.getState().print.quantity), 'number');
  const customNumbers = textInput('print-custom', store.getState().print.customSpec);
  const duplex = checkbox('duplex-print', store.getState().print.duplex);
  printGroup.append(
    fieldLabel(i18n.t('printQuantity'), quantity),
    fieldLabel(i18n.t('customNumbers'), customNumbers),
    fieldLabel(i18n.t('duplex'), duplex),
    fieldLabel('Mode', mode),
  );
  const saveButton = button(i18n.t('save'));
  const restoreButton = button(i18n.t('restore'));
  const restoreFile = textInput('restore-file', '', 'file');
  restoreFile.accept = '.json,.customization.json,application/json';
  restoreFile.className = 'v2-hidden';
  const savedGroup = section(i18n.t('saved'));
  savedGroup.append(saveButton, restoreButton, restoreFile);
  sidebar.append(
    templateGroup,
    controlsGroup,
    togglesGroup,
    typographyGroup,
    textGroup,
    colorsGroup,
    imageGroup,
    printGroup,
    savedGroup,
  );

  const main = document.createElement('section');
  main.className = 'v2-main';
  const previewShell = document.createElement('div');
  previewShell.className = 'v2-preview-shell';
  const ticketWrapper = document.createElement('div');
  ticketWrapper.className = 'v2-ticket-wrapper';
  const ticket = document.createElement('article');
  ticket.className = 'v2-ticket';
  const border = document.createElement('div');
  border.className = 'v2-border';
  border.setAttribute('aria-hidden', 'true');
  const mascot = document.createElement('img');
  mascot.className = 'v2-mascot';
  mascot.alt = 'Mascot';
  const backgroundLayer = document.createElement('div');
  backgroundLayer.className = 'v2-background-layer';
  backgroundLayer.setAttribute('aria-hidden', 'true');
  const dots = document.createElement('div');
  dots.className = 'v2-dots';
  dots.setAttribute('aria-hidden', 'true');
  const dotsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  dotsSvg.setAttribute('viewBox', '0 0 100 100');
  dotsSvg.setAttribute('preserveAspectRatio', 'none');
  const bigDot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bigDot.classList.add('v2-dot', 'big-dot');
  bigDot.setAttribute('d', 'M 5,5 H 95 V 95 H 5 Z');
  const smallDot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  smallDot.classList.add('v2-dot', 'small-dot');
  smallDot.setAttribute('d', 'M 5,5 H 95 V 95 H 5 Z');
  dotsSvg.append(bigDot, smallDot);
  dots.append(dotsSvg);
  const numberFrame = document.createElement('div');
  numberFrame.className = 'v2-number-frame';
  const number = document.createElement('span');
  number.className = 'v2-number';
  number.textContent = '1';
  const message = document.createElement('div');
  message.className = 'v2-message';
  const branch = document.createElement('div');
  branch.className = 'v2-branch';
  numberFrame.append(number);
  ticket.append(border, backgroundLayer, dots, mascot, numberFrame, message, branch);
  ticketWrapper.append(ticket);
  previewShell.append(ticketWrapper);
  main.append(previewShell);
  const footer = document.createElement('nav');
  footer.className = 'v2-footer-nav';
  const footerDesign = button(i18n.t('templates'));
  const footerSettings = button(i18n.t('settings'));
  const footerSaved = button(i18n.t('saved'));
  footer.append(footerDesign, footerSettings, footerSaved);
  root.replaceChildren(header, sidebar, main, footer, notice);

  const isMobilePrintDevice = (): boolean =>
    window.matchMedia('(max-width: 767px)').matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const updateDesign = (mutator: (design: TicketDesignState) => void) => {
    const next = structuredClone(store.getState().design);
    mutator(next);
    store.dispatch({ type: 'SET_DESIGN', design: next });
  };
  const applyDesignToDom = (design: TicketDesignState) => {
    const template = getTemplate(design.template);
    ticket.className = `v2-ticket ${template.cssClass === 'template-spring' ? 'spring' : ''}`;
    const dimensions = resolvedTicketDimensions(design);
    ticket.style.setProperty('--core-width', `${dimensions.coreWidthMm}mm`);
    ticket.style.setProperty('--core-height', `${dimensions.coreHeightMm}mm`);
    ticket.style.setProperty('--cut-margin-x', `${dimensions.marginXMm}mm`);
    ticket.style.setProperty('--cut-margin-y', `${dimensions.marginYMm}mm`);
    ticket.style.setProperty(
      '--user-bg-image',
      design.image.backgroundDataUri ? `url("${design.image.backgroundDataUri}")` : 'none',
    );
    ticket.style.setProperty(
      '--background-layer-image',
      template.cssClass === 'template-spring'
        ? design.image.backgroundDataUri
          ? `url("${design.image.backgroundDataUri}")`
          : `url("${import.meta.env.BASE_URL}assets/spring-background.png")`
        : design.image.backgroundDataUri
          ? `url("${design.image.backgroundDataUri}")`
          : 'none',
    );
    ticket.style.setProperty(
      '--spring-background-image',
      `url("${import.meta.env.BASE_URL}assets/spring-background.png")`,
    );
    ticket.style.setProperty(
      '--spring-number-frame-image',
      `url("${import.meta.env.BASE_URL}assets/spring-number-frame.png")`,
    );
    ticket.style.setProperty(
      '--spring-branch-ribbon-image',
      `url("${import.meta.env.BASE_URL}assets/spring-branch-ribbon.png")`,
    );
    for (const id of CONTROL_IDS) {
      const definition = CONTROL_DEFINITIONS[id];
      const actual = Math.min(
        definition.max,
        Math.max(definition.min, getControlBase(id, design.template) + design.deltas[id]),
      );
      const cssVariable =
        id === 'bg-opacity'
          ? '--bg-opacity'
          : id === 'msg-size'
            ? '--message-size'
            : id === 'msg-y'
              ? '--message-y'
              : id === 'msg-stroke-w'
                ? '--message-stroke-width'
                : id === 'branch-size'
                  ? '--branch-size'
                  : id === 'branch-y'
                    ? '--branch-y'
                    : id === 'branch-width'
                      ? '--branch-width'
                      : id === 'branch-pad-y'
                        ? '--branch-pad-y'
                        : id === 'branch-radius'
                          ? '--branch-radius'
                          : id === 'branch-stroke-w'
                            ? '--branch-stroke-width'
                            : id === 'number-size'
                              ? '--number-size'
                              : id === 'number-offset-y'
                                ? '--number-offset-y'
                                : id === 'mascot-width'
                                  ? '--mascot-width'
                                  : `--${id}`;
      ticket.style.setProperty(cssVariable, `${actual}${definition.unit}`);
      const control = controlElements.get(id);
      if (control) {
        control.value = String(design.deltas[id]);
        control.disabled = template.lockedControls.includes(id);
      }
      const output = document.getElementById(`${id}-output`);
      if (output)
        output.textContent =
          design.deltas[id] > 0 ? `+${design.deltas[id]}` : String(design.deltas[id]);
    }
    for (const [id, color] of Object.entries(design.colors)) {
      const colorInput = colorElements.get(id);
      if (colorInput) {
        colorInput.value = color;
        colorInput.disabled = template.lockedControls.includes(id);
      }
      const cssVariable =
        id === 'number-bg-color'
          ? '--number-bg'
          : id === 'number-border-color'
            ? '--number-border'
            : `--${id}`;
      ticket.style.setProperty(cssVariable, color);
    }
    ticket.style.setProperty('--number-font', design.typography.number.fontFamily);
    ticket.style.setProperty('--number-weight', String(design.typography.number.fontWeight));
    ticket.style.setProperty('--number-style', design.typography.number.fontStyle);
    ticket.style.setProperty(
      '--number-color',
      design.colors['number-color'] ?? design.typography.number.color,
    );
    ticket.style.setProperty('--number-stroke-color', design.typography.number.strokeColor);
    ticket.style.setProperty(
      '--number-stroke-width',
      `${Math.max(0, design.typography.number.strokeWidth)}pt`,
    );
    ticket.style.setProperty(
      '--message-stroke-width',
      `${Math.max(0, design.typography.message.strokeWidth + (design.deltas['msg-stroke-w'] ?? 0))}pt`,
    );
    ticket.style.setProperty('--message-font', design.typography.message.fontFamily);
    ticket.style.setProperty('--message-weight', String(design.typography.message.fontWeight));
    ticket.style.setProperty('--message-style', design.typography.message.fontStyle);
    ticket.style.setProperty(
      '--message-color',
      design.colors['msg-color'] ?? design.typography.message.color,
    );
    ticket.style.setProperty('--message-stroke-color', design.typography.message.strokeColor);
    ticket.style.setProperty(
      '--message-stroke-width',
      `${Math.max(0, design.typography.message.strokeWidth + (design.deltas['msg-stroke-w'] ?? 0))}pt`,
    );
    ticket.style.setProperty('--branch-font', design.typography.branch.fontFamily);
    ticket.style.setProperty('--branch-weight', String(design.typography.branch.fontWeight));
    ticket.style.setProperty('--branch-style', design.typography.branch.fontStyle);
    ticket.style.setProperty(
      '--branch-color',
      design.colors['branch-color'] ?? design.typography.branch.color,
    );
    ticket.style.setProperty('--branch-stroke-color', design.typography.branch.strokeColor);
    ticket.style.setProperty(
      '--branch-stroke-width',
      `${Math.max(0, design.typography.branch.strokeWidth + (design.deltas['branch-stroke-w'] ?? 0))}pt`,
    );
    const bgOpacity = getControlBase('bg-opacity', design.template) + design.deltas['bg-opacity'];
    const actualNumberOffsetY = Math.min(
      CONTROL_DEFINITIONS['number-offset-y'].max,
      Math.max(
        CONTROL_DEFINITIONS['number-offset-y'].min,
        getControlBase('number-offset-y', design.template) + design.deltas['number-offset-y'],
      ),
    );
    ticket.style.setProperty('--number-offset-y', `${actualNumberOffsetY}mm`);
    ticket.style.setProperty('--number-display', design.toggles.number ? 'grid' : 'none');
    ticket.style.setProperty('--message-display', design.toggles.message ? 'block' : 'none');
    ticket.style.setProperty('--branch-display', design.toggles.branch ? 'block' : 'none');
    ticket.style.setProperty(
      '--background-layer-display',
      design.toggles.background ? 'block' : 'none',
    );
    ticket.style.setProperty(
      '--background-layer-opacity',
      String(Math.min(1, Math.max(0, bgOpacity))),
    );
    ticket.style.setProperty('--border-display', design.toggles.border ? 'block' : 'none');
    ticket.style.setProperty('--mascot-display', design.toggles.mascot ? 'block' : 'none');
    ticket.style.setProperty('--dot-display', design.toggles.border ? 'block' : 'none');
    ticket.style.setProperty(
      '--number-stroke-color',
      design.colors['number-color'] ?? design.typography.number.strokeColor,
    );
    ticket.style.setProperty(
      '--message-stroke-color',
      design.colors['msg-stroke-c'] ?? design.typography.message.strokeColor,
    );
    ticket.style.setProperty(
      '--branch-stroke-color',
      design.colors['branch-stroke-c'] ?? design.typography.branch.strokeColor,
    );
    backgroundLayer.style.display = design.toggles.background ? 'block' : 'none';
    backgroundLayer.style.opacity = String(Math.min(1, Math.max(0, bgOpacity)));
    border.style.display = design.toggles.border ? 'block' : 'none';
    dots.style.display = design.toggles.border ? 'block' : 'none';
    mascot.src = design.image.mascotDataUri ?? loadDefaultMascot();
    mascot.onerror = () => {
      mascot.hidden = true;
    };
    mascot.hidden = !design.toggles.mascot;
    message.textContent = design.messageText;
    branch.textContent = design.branchName;
    title.textContent = i18n.t('title');
    document.documentElement.lang = i18n.current === 'jp' ? 'ja' : 'vi';
    document.title = i18n.t('title');
    languageButton.textContent = i18n.current.toUpperCase();
    languageButton.setAttribute('aria-label', i18n.t('language'));
    mode.value = store.getState().print.mode;
    quantity.value = String(store.getState().print.quantity);
    customNumbers.value = store.getState().print.customSpec;
    duplex.checked = store.getState().print.duplex;
  };
  applyDesignToDom(store.getState().design);
  store.subscribe((state, previous) => {
    if (state.design !== previous.design) {
      history.schedule(state.design);
      applyDesignToDom(state.design);
    }
  });
  springButton.addEventListener('click', () =>
    updateDesign((design) => {
      design.template = 'spring';
      design.deltas = Object.fromEntries(
        CONTROL_IDS.map((id) => [id, 0]),
      ) as TicketDesignState['deltas'];
      design.colors['bg-color'] = '#fff9f2';
      design.colors['number-color'] = '#ed5793';
      design.colors['number-bg-color'] = '#ffffff';
      design.colors['number-border-color'] = '#d5ad45';
      design.colors['msg-color'] = '#111111';
      design.colors['msg-stroke-c'] = '#ffffff';
      design.colors['branch-color'] = '#ffffff';
      design.colors['branch-bg'] = '#ec5a8b';
      design.colors['branch-stroke-c'] = '#000000';
      design.typography.number.fontFamily = "'Times New Roman', 'Noto Serif JP', serif";
      design.typography.message.fontFamily = "'Noto Sans JP', sans-serif";
      design.typography.branch.fontFamily = "'Noto Sans JP', sans-serif";
      design.toggles.background = true;
      design.toggles.border = false;
      design.toggles.mascot = true;
      design.toggles.number = true;
      design.toggles.message = true;
      design.toggles.branch = true;
    }),
  );
  standardButton.addEventListener('click', () =>
    updateDesign((design) => {
      const standard = createStandardDesign();
      Object.assign(design, standard);
    }),
  );
  languageButton.addEventListener('click', () => {
    i18n.setLanguage(i18n.current === 'jp' ? 'vn' : 'jp');
    applyDesignToDom(store.getState().design);
  });
  undoButton.addEventListener('click', () => {
    history.setApplying(true);
    try {
      store.dispatch({ type: 'SET_DESIGN', design: history.undo(store.getState().design) });
    } finally {
      history.setApplying(false);
    }
  });
  redoButton.addEventListener('click', () => {
    history.setApplying(true);
    try {
      store.dispatch({ type: 'SET_DESIGN', design: history.redo(store.getState().design) });
    } finally {
      history.setApplying(false);
    }
  });
  for (const control of controlElements.values())
    control.addEventListener('input', () => {
      const id = control.dataset.control as keyof TicketDesignState['deltas'] | undefined;
      if (!id) return;
      updateDesign((design) => {
        design.deltas[id] = Number(control.value);
      });
    });
  coreWidth.addEventListener('input', () =>
    updateDesign((design) => {
      design.dimensions.coreWidthMm = Number(coreWidth.value);
    }),
  );
  coreHeight.addEventListener('input', () =>
    updateDesign((design) => {
      design.dimensions.coreHeightMm = Number(coreHeight.value);
    }),
  );
  branchName.addEventListener('input', () =>
    updateDesign((design) => {
      design.branchName = branchName.value;
    }),
  );
  messageText.addEventListener('input', () =>
    updateDesign((design) => {
      design.messageText = messageText.value;
    }),
  );
  for (const color of colorsGroup.querySelectorAll<HTMLInputElement>('input[type="color"]'))
    color.addEventListener('input', () =>
      updateDesign((design) => {
        design.colors[color.id] = color.value;
      }),
    );
  for (const toggle of togglesGroup.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    toggle.addEventListener('change', () =>
      updateDesign((design) => {
        const id = toggle.dataset.toggle as keyof TicketDesignState['toggles'];
        design.toggles[id] = toggle.checked;
      }),
    );
  numberFont.addEventListener('change', () =>
    updateDesign((design) => {
      design.typography.number.fontFamily = numberFont.value;
    }),
  );
  messageFont.addEventListener('change', () =>
    updateDesign((design) => {
      design.typography.message.fontFamily = messageFont.value;
    }),
  );
  branchFont.addEventListener('change', () =>
    updateDesign((design) => {
      design.typography.branch.fontFamily = branchFont.value;
    }),
  );
  bgFile.addEventListener('change', () => {
    void (async () => {
      const file = bgFile.files?.[0];
      if (!file) return;
      try {
        const uri = await readImageFile(file, 'background');
        updateDesign((design) => {
          design.image.backgroundDataUri = uri;
        });
      } catch {
        showNotice(i18n.t('invalidImage'));
      }
    })();
  });
  mascotFile.addEventListener('change', () => {
    void (async () => {
      const file = mascotFile.files?.[0];
      if (!file) return;
      try {
        const uri = await readImageFile(file, 'mascot');
        const processed = await processMascotDataUri(uri, removeWhite.checked);
        updateDesign((design) => {
          design.image.mascotDataUri = processed;
          design.image.mascotSource = 'custom';
        });
      } catch {
        showNotice(i18n.t('invalidImage'));
      }
    })();
  });
  removeWhite.addEventListener('change', () => {
    const uri = store.getState().design.image.mascotDataUri;
    if (uri)
      void processMascotDataUri(uri, removeWhite.checked).then((processed) =>
        updateDesign((design) => {
          design.image.mascotDataUri = processed;
        }),
      );
  });
  mode.addEventListener('change', () =>
    store.dispatch({
      type: 'SET_PRINT',
      print: { ...store.getState().print, mode: mode.value === 'custom' ? 'custom' : 'sequential' },
    }),
  );
  quantity.addEventListener('input', () =>
    store.dispatch({
      type: 'SET_PRINT',
      print: {
        ...store.getState().print,
        quantity: Math.min(5000, Math.max(1, Number(quantity.value) || 1)),
      },
    }),
  );
  customNumbers.addEventListener('input', () =>
    store.dispatch({
      type: 'SET_PRINT',
      print: { ...store.getState().print, customSpec: customNumbers.value },
    }),
  );
  duplex.addEventListener('change', () =>
    store.dispatch({
      type: 'SET_PRINT',
      print: { ...store.getState().print, duplex: duplex.checked },
    }),
  );
  saveButton.addEventListener('click', () => {
    const data = JSON.stringify({
      app: 'RaiRaiTei Queue Ticket',
      format: 'rairaitei-design',
      version: 2,
      savedAt: new Date().toISOString(),
      design: store.getState().design,
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = 'Ticket_Design_V2.customization.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  });
  restoreButton.addEventListener('click', () => restoreFile.click());
  restoreFile.addEventListener('change', () => {
    void (async () => {
      const file = restoreFile.files?.[0];
      if (!file) return;
      try {
        if (file.size > MAX_IMPORT_BYTES) throw new Error('Design file is too large.');
        const result = migrateCustomization(JSON.parse(await file.text()));
        if (!result.ok) {
          showNotice(result.errors.join('\n'));
          return;
        }
        store.dispatch({ type: 'SET_DESIGN', design: result.value.design });
      } catch {
        showNotice(i18n.t('invalidDesign'));
      }
    })();
  });
  const setPanelMode = (panel: 'design' | 'settings' | 'saved') => {
    sidebar.classList.toggle('settings-mode', panel === 'settings');
    tabs.classList.toggle('settings-mode', panel === 'settings');
    sidebar.classList.toggle('open', panel !== 'design');
    const groups = [
      templateGroup,
      controlsGroup,
      togglesGroup,
      typographyGroup,
      textGroup,
      colorsGroup,
      imageGroup,
      printGroup,
      savedGroup,
    ];
    groups.forEach((group) => group.classList.remove('v2-hidden'));
    if (panel === 'settings') {
      templateGroup.classList.add('v2-hidden');
      savedGroup.classList.add('v2-hidden');
    }
    if (panel === 'saved')
      groups
        .filter((group) => group !== savedGroup)
        .forEach((group) => group.classList.add('v2-hidden'));
  };
  designTab.addEventListener('click', () => setPanelMode('design'));
  settingsTab.addEventListener('click', () => setPanelMode('settings'));
  savedTab.addEventListener('click', () => setPanelMode('saved'));
  backButton.addEventListener('click', () => setPanelMode('design'));
  [footerDesign, footerSettings, footerSaved].forEach((element, index) =>
    element.addEventListener('click', () =>
      setPanelMode(index === 1 ? 'settings' : index === 2 ? 'saved' : 'design'),
    ),
  );
  printButton.addEventListener('click', () => {
    void (async () => {
      const design = store.getState().design;
      const print = store.getState().print;
      const layout = calculateLayout(resolvedTicketDimensions(design), print.duplex);
      const tickets =
        print.mode === 'custom'
          ? parseCustomRange(print.customSpec)
          : Array.from(
              { length: Math.min(5000, Math.max(1, print.quantity)) },
              (_, index) => index + 1,
            );
      if (!tickets.length || layout.totalPerPage < 1) {
        showNotice(!tickets.length ? i18n.t('invalid') : i18n.t('tooLarge'));
        return;
      }
      try {
        if (isMobilePrintDevice()) {
          await buildMobilePdf(ticket, tickets, layout, print, i18n, showNotice);
        } else {
          await buildDesktopPrint(ticket, tickets, layout, print, i18n, showNotice);
        }
      } catch {
        try {
          await buildDesktopPrint(ticket, tickets, layout, print, i18n, showNotice);
        } catch {
          showNotice(i18n.t('pdfError'));
        }
      }
    })();
  });
}
