import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Read version directly from package.json (Single Source of Truth)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// Extract current Git commit hash for Big Tech automated build traceability
let gitCommitHash = 'production'
try {
  gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  gitCommitHash = 'rev-head'
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0'),
    __GIT_COMMIT_HASH__: JSON.stringify(gitCommitHash),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/api/v1': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/hubs': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('axios')) return 'vendor_axios'
            if (id.includes('html2canvas')) return 'vendor_html2canvas'
            if (id.includes('purify')) return 'vendor_purify'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor_react'
            if (id.includes('react-router-dom')) return 'vendor_router'
            if (id.includes('@headlessui')) return 'vendor_headlessui'
            if (id.includes('xlsx')) return 'vendor_xlsx'
            if (id.includes('jspdf')) return 'vendor_jspdf'
            if (id.includes('jspdf-autotable')) return 'vendor_jspdf_plugins'
            if (id.includes('react-datepicker')) return 'vendor_datepicker'
            if (id.includes('sweetalert2')) return 'vendor_swal'
            return 'vendor'
          }
        }
      }
    }
  }
})
