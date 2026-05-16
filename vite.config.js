import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This base property is CRITICAL for GitHub Pages hosting!
  // It tells Vite to load files from /Zetcam/ instead of the root directory.
  base: '/Zetcam/'
})