import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceImage = join(rootDir, 'assets', 'images', 'exticon.png');
const iconsDir = join(rootDir, 'assets', 'icons');

// Create icons directory if it doesn't exist
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 64, 128];

console.log('Generating icons from exticon.png...');

Promise.all([
  // Generate normal icons
  ...sizes.map(async (size) => {
    const outputPath = join(iconsDir, `icon${size}.png`);
    await sharp(sourceImage)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icon${size}.png`);
  }),
  // Generate disabled (greyscale) icons
  ...sizes.map(async (size) => {
    const outputPath = join(iconsDir, `icon${size}-disabled.png`);
    await sharp(sourceImage)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .greyscale()
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icon${size}-disabled.png`);
  })
]).then(() => {
  console.log('\n✅ All icons generated successfully!');
}).catch((err) => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
