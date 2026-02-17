# Stixify Chrome Extension

Convert webpages to PDF and submit to Stixify for STIX translation directly from your browser.

## Features

- Capture web pages as PDFs
- Submit to Stixify API for STIX translation
- Track job status and view results
- Configurable API settings

## Installation

### From Release

1. Download the latest release zip file from the [Releases page](https://github.com/muchdogesec/stixify_chrome_extension/releases)
2. Extract the zip file to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the extracted folder
6. The Stixify extension icon should appear in your browser toolbar

## Building Locally

### Prerequisites

- Node.js 20 or higher
- npm

### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/muchdogesec/stixify_chrome_extension.git
   cd stixify_chrome_extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

   The built extension will be in the `dist/` folder.

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder from your project directory

### Development

To build in watch mode for development:

```bash
npm run dev
```

This will automatically rebuild the extension when you make changes to the source files. You'll need to reload the extension in Chrome to see the changes.

### Available Scripts

- `npm run build` - Build the extension for production
- `npm run icons` - Generate extension icons from source
- `npm run sync-version` - Sync version from package.json to manifest.json
- `npm run dev` - Build in watch mode for development

## Usage

1. Click the Stixify extension icon in your browser toolbar
2. Configure your API settings in the Options page
3. Navigate to any webpage you want to convert
4. Click the extension icon and submit the page
5. Track your jobs in the Jobs tab

## Project Structure

```
stixify_chrome_extension/
├── src/
│   ├── manifest.json         # Extension manifest
│   ├── background/           # Background service worker
│   ├── popup/                # Extension popup UI
│   └── options/              # Options/settings page
├── assets/                   # Icons and images
├── scripts/                  # Build scripts
└── dist/                     # Built extension (generated)
```

## License

See the LICENSE file for details.

## Support

For issues and questions, please visit the [GitHub Issues](https://github.com/muchdogesec/stixify_chrome_extension/issues) page.
