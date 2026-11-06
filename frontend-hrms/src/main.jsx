import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'
import ErrorOverlay from './components/ErrorOverlay'
import ErrorBoundary from './components/ErrorBoundary'
import { initGlobalErrorHandler } from './utils/globalErrorHandler'
import { APP_FULL_NAME, APP_RELEASE_LABEL, GIT_COMMIT_HASH } from './config/version'

// Initialize global handlers (console/window)
initGlobalErrorHandler()

// Big Tech standard runtime startup stamp
if (typeof window !== 'undefined') {
  console.info(
    `%c ${APP_FULL_NAME} %c ${APP_RELEASE_LABEL} (${GIT_COMMIT_HASH}) `,
    'background:#7c3aed; color:#ffffff; font-weight:bold; padding:2px 8px; border-radius:4px 0 0 4px;',
    'background:#0f172a; color:#38bdf8; font-weight:bold; padding:2px 8px; border-radius:0 4px 4px 0;'
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <App />
          <ErrorOverlay />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
