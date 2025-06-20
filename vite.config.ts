import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/dagre-poc-with-childs/', 
  plugins: [react()]
})
