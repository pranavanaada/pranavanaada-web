import { supabase } from './supabaseClient';

const BUCKET = 'product-images';
export const FULL_WIDTH = 1400;
export const THUMB_WIDTH = 600;

/**
 * Resize and re-encode an image in the browser before upload, so a 4 MB phone
 * photo becomes a ~200–400 KB WebP (JPEG where WebP encoding isn't supported).
 */
export async function compressImage(file: Blob, maxWidth: number, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode('image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await encode('image/jpeg');
  if (!jpeg) throw new Error('Could not process image');
  return jpeg;
}

const extFor = (blob: Blob) => (blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg');

async function uploadBlob(blob: Blob, folder: string, baseName: string) {
  const safe = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${extFor(blob)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000', // files are never overwritten (unique names), so cache for a year
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface UploadedImage {
  url: string;
  /** Small version for cards; only created for the photo being uploaded as main. */
  thumb?: string;
}

/** Compress and upload one photo (full size + card thumbnail). */
export async function uploadProductImage(file: Blob, name = 'photo', folder = 'products'): Promise<UploadedImage> {
  const [full, thumb] = await Promise.all([compressImage(file, FULL_WIDTH), compressImage(file, THUMB_WIDTH, 0.78)]);
  const [url, thumbUrl] = await Promise.all([
    uploadBlob(full, folder, name),
    uploadBlob(thumb, `${folder}/thumbs`, name),
  ]);
  return { url, thumb: thumbUrl };
}

/** Upload an already-optimised file as-is (used when importing the starter catalog). */
export async function uploadAsIs(src: string, name: string, folder = 'products') {
  const blob = await fetch(src).then((r) => {
    if (!r.ok) throw new Error(`Could not read ${src}`);
    return r.blob();
  });
  return uploadBlob(blob, folder, name);
}
