import type { I18n } from '../i18n/i18n';
import type { LayoutConfig, PrintConfig } from '../core/types';
import { buildPagePlan, buildDuplexPrintPlan } from '../ticket/geometry';

function printCss(width: number, height: number, layout: LayoutConfig): string {
  return `@page{size:A4 ${layout.orientation};margin:0!important}html,body{margin:0;padding:0;width:${width}mm;height:auto;overflow:visible;background:#fff}.print-page{display:block;width:${width}mm;height:${height}mm;min-height:${height}mm;padding:5mm;box-sizing:border-box;overflow:hidden;break-inside:avoid}.print-page+.print-page{break-before:page}.print-grid{display:grid;grid-template-columns:repeat(${layout.bestCols},${layout.ticketW}mm);grid-template-rows:repeat(${layout.bestRows},${layout.ticketH}mm);width:100%;height:100%;justify-content:center;align-content:center}.print-ticket{width:${layout.ticketW}mm;height:${layout.ticketH}mm;max-width:none;break-inside:avoid}.print-empty{visibility:hidden}.side-title{height:15mm;display:flex;align-items:center;justify-content:center;font:700 14pt Arial;letter-spacing:.18em}.duplex .print-grid{height:calc(100% - 18mm)}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}`;
}
function pageMarkup(
  ticket: HTMLElement,
  tickets: number[],
  layout: LayoutConfig,
  duplex: boolean,
): string {
  const template = ticket.outerHTML;
  const pages = duplex
    ? buildDuplexPrintPlan(tickets, layout).pages
    : buildPagePlan(tickets, layout);
  return pages
    .map(
      (page) =>
        `<section class="print-page ${duplex ? 'duplex' : ''}">${duplex ? `<header class="side-title">${page.side === 'front' ? 'FRONT' : 'BACK'}</header>` : ''}<div class="print-grid">${page.cells.map((cell) => (cell.ticket === null ? '<div class="print-ticket print-empty"></div>' : `<div class="print-ticket">${template.replace(/(class="v2-number">)[^<]*/, `$1${cell.ticket}`)}</div>`)).join('')}</div></section>`,
    )
    .join('');
}
export async function buildDesktopPrint(
  ticket: HTMLElement,
  tickets: number[],
  layout: LayoutConfig,
  print: PrintConfig,
  i18n: I18n,
  showNotice: (message: string) => void,
): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.append(frame);
  const documentRef = frame.contentDocument;
  if (!documentRef) {
    frame.remove();
    throw new Error('Print frame unavailable.');
  }
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 120000);
  const width = layout.orientation === 'landscape' ? 297 : 210;
  const height = layout.orientation === 'landscape' ? 210 : 297;
  const copiedStyles = [...document.head.querySelectorAll('link[rel="stylesheet"], style')]
    .map((node) => node.outerHTML)
    .join('\n');
  documentRef.open();
  documentRef.write(
    `<!doctype html><html lang="${document.documentElement.lang}"><head><meta charset="UTF-8"><base href="${document.baseURI}">${copiedStyles}<style>${printCss(width, height, layout)}</style></head><body><main>${pageMarkup(ticket, tickets, layout, print.duplex)}</main></body></html>`,
  );
  documentRef.close();
  try {
    await documentRef.fonts.ready;
    await Promise.all(
      [...documentRef.images].map(async (image) => {
        if (!image.complete)
          await new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          });
        if (image.decode)
          try {
            await image.decode();
          } catch {
            /* The browser may still be able to print the decoded image. */
          }
      }),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : i18n.t('pdfError'));
    throw error;
  } finally {
    // The timeout and afterprint listener own cleanup after print starts.
  }
}
