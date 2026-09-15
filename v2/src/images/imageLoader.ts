import { MAX_IMAGE_DATA_URI_BYTES } from '../core/constants';

const DEFAULT_MASCOT = `${import.meta.env.BASE_URL}assets/mascot.png`;
const MIME_SIGNATURES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

function hasSignature(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}
function isWebp(bytes: Uint8Array): boolean {
  return (
    hasSignature(bytes, MIME_SIGNATURES['image/webp'] ?? []) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
export function loadDefaultMascot(): string {
  return DEFAULT_MASCOT;
}

export async function processMascotDataUri(
  dataUri: string,
  removeWhiteBackground: boolean,
): Promise<string> {
  if (!removeWhiteBackground) return dataUri;
  const image = new Image();
  image.src = dataUri;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not decode mascot image.'));
  });
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable.');
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index];
    const green = pixels.data[index + 1];
    const blue = pixels.data[index + 2];
    if (
      red !== undefined &&
      green !== undefined &&
      blue !== undefined &&
      red > 245 &&
      green > 245 &&
      blue > 245
    )
      pixels.data[index + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function readImageFile(file: File, kind: 'background' | 'mascot'): Promise<string> {
  const signature = MIME_SIGNATURES[file.type];
  if (!signature || file.size > MAX_IMAGE_DATA_URI_BYTES[kind])
    throw new Error('Invalid or oversized image file.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasSignature(bytes, signature) || (file.type === 'image/webp' && !isWebp(bytes)))
    throw new Error('Image content does not match its MIME type.');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read image.'));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}
