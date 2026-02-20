import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS SECTION ---
  server: {
    port: 3001,
  }
  // ------------------------
})