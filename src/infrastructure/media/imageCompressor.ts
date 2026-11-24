const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15 MB input guard against mobile OOM
const MAX_OUTPUT_BYTES = 4.8 * 1024 * 1024; // Stay under Firebase Storage 5 MB security rule

function loadImageFromObjectUrl(file: File): Promise<{
  source: HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          img.src = '';
          URL.revokeObjectURL(objectUrl);
        },
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Görsel işlenemedi. Lütfen farklı bir fotoğraf seçin.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Memory-safe client-side image resizer & JPEG compressor.
 * Uses createImageBitmap (with Image + ObjectURL fallback) instead of FileReader DataURL
 * to avoid doubling heap RAM on mobile devices, and releases Canvas backing memory immediately.
 */
export async function compressImageFileToBlob(
  file: File,
  maxWidth = 1080,
  quality = 0.8
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Lütfen geçerli bir görsel dosyası (JPG, PNG veya WebP) seçin.');
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('Seçilen fotoğraf 15 MB sınırını aşıyor. Daha küçük bir görsel seçin.');
  }

  let drawable: CanvasImageSource;
  let srcWidth: number;
  let srcHeight: number;
  let cleanup: () => void;

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      drawable = bitmap;
      srcWidth = bitmap.width;
      srcHeight = bitmap.height;
      cleanup = () => bitmap.close();
    } catch {
      const fallback = await loadImageFromObjectUrl(file);
      drawable = fallback.source;
      srcWidth = fallback.width;
      srcHeight = fallback.height;
      cleanup = fallback.cleanup;
    }
  } else {
    const fallback = await loadImageFromObjectUrl(file);
    drawable = fallback.source;
    srcWidth = fallback.width;
    srcHeight = fallback.height;
    cleanup = fallback.cleanup;
  }

  const canvas = document.createElement('canvas');
  try {
    const scale = srcWidth > maxWidth ? maxWidth / srcWidth : 1;
    const targetW = Math.max(1, Math.round(srcWidth * scale));
    const targetH = Math.max(1, Math.round(srcHeight * scale));

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Tarayıcı görsel sıkıştırmayı desteklemiyor.');
    }

    ctx.drawImage(drawable, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Görsel sıkıştırılamadı.'));
            return;
          }
          resolve(result);
        },
        'image/jpeg',
        quality
      );
    });

    if (blob.size > MAX_OUTPUT_BYTES) {
      throw new Error('Sıkıştırılmış görsel 5 MB sınırını aşıyor. Lütfen daha küçük bir görsel seçin.');
    }

    return blob;
  } finally {
    cleanup();
    // Explicitly release Canvas GPU/backing buffer memory
    canvas.width = 0;
    canvas.height = 0;
  }
}
