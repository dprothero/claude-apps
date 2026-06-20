import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Served from https://dprothero.github.io/claude-apps/ on GitHub Pages.
  base: '/claude-apps/',
  plugins: [react()],
})
