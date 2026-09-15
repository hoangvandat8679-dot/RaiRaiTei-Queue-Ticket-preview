import type { I18n } from '../i18n/i18n';
import type { LayoutConfig, PrintConfig } from '../core/types';
import { JPEG_QUALITY } from '../core/constants';
import {
  getPdfRasterScale,
  numberMetricsForCanvas,
  buildPagePlan,
  buildDuplexPrintPlan,
} from '../ticket/geometry';

interface CanvasMetrics {
  pixelRatio: number;
  fontSizePx: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  centerRatioX: number;
  centerRatioY: number;
}
interface ImageApi {
  toCanvas(node: HTMLElement, options?: Record<string, unknown>): Promise<HTMLCanvasElement>;
  getFontEmbedCSS?(node: HTMLElement): Promise<string>;
}
interface PdfApi {
  new (options: Record<string, unknown>): {
    addPage(format: string, orientation: string): void;
    addImage(
      data: string,
      type: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: string,
    ): void;
    output(type: 'blob'): Blob;
  };
}

async function loadApis(): Promise<{
  image: ImageApi;
  fallback: (node: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  Pdf: PdfApi;
}> {
  const [imageModule, pdfModule] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const image: ImageApi = imageModule;
  const fallback = async (
    node: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<HTMLCanvasElement> => {
    const fallbackModule = await import('html2canvas');
    return fallbackModule.default(node, options);
  };
  const Pdf = (pdfModule as unknown as { jsPDF: PdfApi }).jsPDF;
  return { image, fallback, Pdf };
}
function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const next = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => next(left - 1));
    next(count);
  });
}
async function waitImages(root: HTMLElement): Promise<void> {
  await Promise.all(
    [...root.querySelectorAll('img')].map(async (image) => {
      if (!image.complete)
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      if (image.decode)
        try {
          await image.decode();
        } catch {
          /* browser can still draw a decoded image */
        }
    }),
  );
  await waitFrames();
}
function metrics(ticket: HTMLElement, number: HTMLElement, scale: number): CanvasMetrics | null {
  const ticketRect = ticket.getBoundingClientRect();
  const numberRect = number.getBoundingClientRect();
  const style = getComputedStyle(number);
  if (!ticketRect.width || style.display === 'none') return null;
  return {
    pixelRatio: scale,
    fontSizePx: parseFloat(style.fontSize),
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    color: style.color,
    centerRatioX: (numberRect.left + numberRect.width / 2 - ticketRect.left) / ticketRect.width,
    centerRatioY: (numberRect.top + numberRect.height / 2 - ticketRect.top) / ticketRect.height,
  };
}
function drawNumber(
  context: CanvasRenderingContext2D,
  data: CanvasMetrics | null,
  text: string,
): void {
  if (!data) return;
  const dimensions = numberMetricsForCanvas(
    data,
    text,
    context.canvas.width,
    context.canvas.height,
  );
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = dimensions.color;
  context.font = dimensions.font;
  context.fillText(text, dimensions.x, dimensions.y);
}
async function capture(
  ticket: HTMLElement,
  image: ImageApi,
  fallback: (node: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>,
  scale: number,
  fontEmbedCSS?: string,
): Promise<HTMLCanvasElement> {
  try {
    return await image.toCanvas(ticket, {
      backgroundColor: '#ffffff',
      pixelRatio: scale,
      cacheBust: false,
      skipAutoScale: true,
      fontEmbedCSS,
    });
  } catch {
    return fallback(ticket, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });
  }
}

export async function buildMobilePdf(
  ticket: HTMLElement,
  tickets: number[],
  layout: LayoutConfig,
  print: PrintConfig,
  i18n: I18n,
  showNotice: (message: string) => void,
): Promise<void> {
  const { image, fallback, Pdf } = await loadApis();
  const scale = getPdfRasterScale(layout.ticketW);
  const originalNumber = ticket.querySelector<HTMLElement>('.v2-number');
  if (!originalNumber) throw new Error('Ticket number element missing.');
  const originalText = originalNumber.textContent ?? '1';
  try {
    await document.fonts.ready;
    await waitImages(ticket);
    await waitFrames();
    const fontCss = image.getFontEmbedCSS ? await image.getFontEmbedCSS(ticket) : undefined;
    originalNumber.textContent = '0123456789';
    await waitFrames();
    const numberMetrics = metrics(ticket, originalNumber, scale);
    originalNumber.textContent = '';
    await waitFrames();
    const warmup = await capture(ticket, image, fallback, scale, fontCss);
    warmup.width = 1;
    warmup.height = 1;
    await waitFrames();
    const base = await capture(ticket, image, fallback, scale, fontCss);
    const canvas = document.createElement('canvas');
    canvas.width = base.width;
    canvas.height = base.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable.');
    const pdf = new Pdf({
      orientation: layout.orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pagePlan = print.duplex
      ? buildDuplexPrintPlan(tickets, layout).pages
      : buildPagePlan(tickets, layout);
    const pageWidth = layout.orientation === 'landscape' ? 297 : 210;
    const pageHeight = layout.orientation === 'landscape' ? 210 : 297;
    const header = print.duplex ? 18 : 0;
    const startX = 5 + Math.max(0, (pageWidth - 10 - layout.bestCols * layout.ticketW) / 2);
    const startY =
      5 + header + Math.max(0, (pageHeight - 10 - header - layout.bestRows * layout.ticketH) / 2);
    for (let pageIndex = 0; pageIndex < pagePlan.length; pageIndex += 1) {
      const page = pagePlan[pageIndex];
      if (!page) continue;
      if (pageIndex > 0) pdf.addPage('a4', layout.orientation);
      for (const cell of page.cells) {
        if (cell.ticket === null) continue;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(base, 0, 0);
        drawNumber(context, numberMetrics, String(cell.ticket));
        pdf.addImage(
          canvas.toDataURL('image/jpeg', JPEG_QUALITY),
          'JPEG',
          startX + cell.column * layout.ticketW,
          startY + cell.row * layout.ticketH,
          layout.ticketW,
          layout.ticketH,
          undefined,
          'FAST',
        );
      }
    }
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 300000);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : i18n.t('pdfError'));
    throw error;
  } finally {
    originalNumber.textContent = originalText;
  }
}
