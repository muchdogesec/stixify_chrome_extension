import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html')
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.name === 'popup') {
            return 'src/popup/popup.js'
          }
          if (chunkInfo.name === 'options') {
            return 'src/options/options.js'
          }
          return 'src/[name]/[name].js'
        },
        chunkFileNames: 'src/chunks/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'popup.css') {
            return 'src/popup/popup.css'
          }
          if (assetInfo.name === 'options.css') {
            return 'src/options/options.css'
          }
          if (assetInfo.name.endsWith('.css')) {
            return 'src/popup/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
