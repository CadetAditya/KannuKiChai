/**
 * Compresses and resizes an image file in the browser using Canvas
 * to ensure fast, reliable uploads without hitting network or payload size limits.
 * 
 * @param {File} file - The uploaded image file
 * @param {number} maxWidth - Maximum width (default 1280px)
 * @param {number} maxHeight - Maximum height (default 1280px)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default 0.82)
 * @returns {Promise<string>} Base64 data URL string
 */
export function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserved scaled dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas not supported
          return resolve(e.target.result);
        }

        // Draw image smoothly on canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
