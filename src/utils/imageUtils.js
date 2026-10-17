/**
 * Utility to compress and resize images client-side before saving to state/DB.
 * Compresses any large phone/camera photo (5MB+) into a crisp ~20KB-35KB JPEG/WebP.
 */
export async function compressImageFile(file, { maxWidth = 240, maxHeight = 240, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate center square crop or aspect-fit for cameo portraits
          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;

          // Square center crop to match round cameos
          if (srcW > srcH) {
            srcX = (srcW - srcH) / 2;
            srcW = srcH;
          } else if (srcH > srcW) {
            srcY = (srcH - srcW) / 2;
            srcH = srcW;
          }

          const targetSize = Math.min(maxWidth, srcW);
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not initialize canvas context.'));
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the center crop into the square canvas
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetSize, targetSize);

          // Export as compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Estimate size in KB
          const sizeInBytes = Math.round((compressedDataUrl.length * 3) / 4);
          const sizeInKB = Math.round(sizeInBytes / 1024);

          resolve({
            dataUrl: compressedDataUrl,
            sizeInKB,
            width: targetSize,
            height: targetSize
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Could not load image data.'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.readAsDataURL(file);
  });
}
