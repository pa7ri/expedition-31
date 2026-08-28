import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the app under /<repo>/. Set base so built asset URLs resolve.
// Override with VITE_BASE=/ for local `vite preview` at root if desired.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/expedition-31/',
  plugins: [react()],
})
