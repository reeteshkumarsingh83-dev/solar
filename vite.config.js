import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // archives in the project root can be locked while being written, which crashes the file watcher (EBUSY)
    watch: { ignored: ['**/*.zip'] },
  },
})
