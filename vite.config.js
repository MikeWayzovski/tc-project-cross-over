import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    cors: true, // Dit lost het CORS probleem uit de Trimble documentatie op
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
})