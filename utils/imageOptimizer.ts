
export const compressImage = async (
  file: File, 
  isHighRes: boolean = false, 
  isThumbnail: boolean = false,
  maxSizeKB?: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Check if file is already small enough
    if (maxSizeKB && file.size <= maxSizeKB * 1024) {
        return resolve(file);
    }

    let maxWidth = 1280;
    let initialQuality = 0.75;
    
    if (isHighRes) {
        maxWidth = 1920;
        initialQuality = 0.85;
    }
    
    if (isThumbnail) {
        // Increased from 400 to 500 px width
        maxWidth = 500;
        // Increased quality from 0.6 to 0.85 (less compression)
        initialQuality = 0.85;
    }

    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const runCompression = (w: number, h: number, q: number, attempt: number) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  // Size check
                  if (maxSizeKB && blob.size > maxSizeKB * 1024 && attempt < 5) {
                      // Reduce quality or resize
                      let newQ = q - 0.1;
                      let newW = w;
                      let newH = h;

                      // If quality drops too low, resize instead
                      if (newQ < 0.6) {
                          newQ = 0.8; // Reset quality
                          newW = Math.round(w * 0.8);
                          newH = Math.round(h * 0.8);
                      }

                      // Recursive call
                      runCompression(newW, newH, newQ, attempt + 1);
                      return;
                  }

                  const suffix = isThumbnail ? "_thumb.webp" : ".webp";
                  const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                  const newFileName = `${originalName}${suffix}`;
                  
                  const newFile = new File([blob], newFileName, {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(newFile);
                } else {
                  reject(new Error('Canvas to Blob failed'));
                }
              },
              'image/webp',
              q
            );
        };

        // Start compression
        runCompression(width, height, initialQuality, 0);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
