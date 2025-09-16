import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    coverage: {
      provider: 'v8',          // or 'istanbul'
      reporter: ['text', 'html'], // 'text' shows in console, 'html' gives a browsable report
      reportsDirectory: './coverage', // default
      exclude: ['node_modules/', '.next/'], // ignore noise
    },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})