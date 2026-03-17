import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Copy files
console.log('Copying extension files...');

// Copy assets
cpSync(join(rootDir, 'assets'), join(distDir, 'assets'), { recursive: true });
console.log('✓ Copied assets');

// Copy background scripts
cpSync(join(rootDir, 'src', 'background'), join(distDir, 'src', 'background'), { recursive: true });
console.log('✓ Copied background scripts');

// Copy content scripts
cpSync(join(rootDir, 'src', 'content'), join(distDir, 'src', 'content'), { recursive: true });
console.log('✓ Copied content scripts');

// Read package.json version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

// Copy manifest and replace version placeholder
const manifestTemplate = readFileSync(join(rootDir, 'src', 'manifest.templ.json'), 'utf8');
const manifest = manifestTemplate.replace('<PREBUILD_VERSION_PLACEHOLDER>', version);
writeFileSync(join(distDir, 'manifest.json'), manifest);
console.log(`✓ Generated manifest.json (version ${version})`);

console.log('\n✅ Build complete! Extension is ready in the dist/ folder');
console.log('Load the dist/ folder as an unpacked extension in Chrome.');
