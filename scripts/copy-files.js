import { copyFileSync, cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Ensure dist/src directories exist
const srcDirs = ['background'];
srcDirs.forEach(dir => {
  const targetDir = join(distDir, 'src', dir);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
});

// Copy files
console.log('Copying extension files...');

// Copy assets
cpSync(join(rootDir, 'assets'), join(distDir, 'assets'), { recursive: true });
console.log('✓ Copied assets');

// Copy background scripts
cpSync(join(rootDir, 'src', 'background'), join(distDir, 'src', 'background'), { recursive: true });
console.log('✓ Copied background scripts');

// Copy manifest
copyFileSync(join(rootDir, 'src', 'manifest.json'), join(distDir, 'manifest.json'));
console.log('✓ Copied manifest.json');

console.log('\n✅ Build complete! Extension is ready in the dist/ folder');
console.log('Load the dist/ folder as an unpacked extension in Chrome.');
