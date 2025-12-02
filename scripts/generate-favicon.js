const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Source image path (make sure to place your logo.png in the project root)
const sourceImage = path.join(__dirname, '../Mawater974Logo.png');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error('Source image not found. Please place Mawater974Logo.png in the project root.');
  process.exit(1);
}

// Generate favicon.ico (16x16, 32x32, 48x48)
async function generateFavicon() {
  try {
    const sizes = [16, 32, 48];
    
    // Create favicon.ico with multiple sizes
    const sharpIcon = sharp(sourceImage);
    
    // Generate ICO file with multiple sizes
    await sharpIcon
      .resize(64, 64) // Start with a larger size for better quality
      .toFile(path.join(publicDir, 'favicon.ico'))
      .then(() => console.log('Generated favicon.ico'));

    // Generate individual PNG files
    for (const size of sizes) {
      await sharpIcon
        .resize(size, size)
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`))
        .then(() => console.log(`Generated favicon-${size}x${size}.png`));
    }

    // Generate apple-touch-icon.png (180x180)
    await sharpIcon
      .resize(180, 180)
      .toFile(path.join(publicDir, 'apple-touch-icon.png'))
      .then(() => console.log('Generated apple-touch-icon.png'));

    // Generate site.webmanifest
    const manifest = {
      name: 'Mawater974',
      short_name: 'Mawater974',
      icons: [
        {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png'
        },
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone'
    };

    fs.writeFileSync(
      path.join(publicDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('Generated site.webmanifest');

  } catch (err) {
    console.error('Error generating favicon:', err);
  }
}

// Run the generation
generateFavicon();
