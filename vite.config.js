import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      // Ignore database.json so Vite doesn't refresh the browser when orders are saved
      ignored: ['**/database.json']
    }
  }
})