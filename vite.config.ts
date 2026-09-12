import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the app under /<repo>/. Set base so built asset URLs resolve.
// Override with VITE_BASE=/ for local `vite preview` at root if desired.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/expedition-31/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Split heavy vendors into their own cacheable chunks so the app shell parses fast on
        // phones and framer-motion / supabase / qrcode load in parallel and cache independently.
        manualChunks(id: string) {
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('qrcode')) return 'qrcode'
        },
      },
    },
  },
})
