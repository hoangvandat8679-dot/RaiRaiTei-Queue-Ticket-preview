interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'html-to-image' {
  export function toCanvas(
    node: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<HTMLCanvasElement>;
  export function getFontEmbedCSS(node: HTMLElement): Promise<string>;
}
declare module 'html2canvas' {
  const html2canvas: (
    node: HTMLElement,
    options?: Record<string, unknown>,
  ) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}
