import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const toastMeta = {
  success: { Icon: CheckCircle2, className: 'toast-success' },
  error: { Icon: AlertCircle, className: 'toast-error' },
  warning: { Icon: AlertTriangle, className: 'toast-warning' },
  info: { Icon: Info, className: 'toast-info' },
}

function normalizeType(type) {
  if (type === 'warn') return 'warning'
  return toastMeta[type] ? type : 'info'
}

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const recentMessages = useRef(new Map())

  const showToast = useCallback((message, type = 'info', timeout = 4000) => {
    if (!message) return
    const toastType = normalizeType(type)
    const key = `${toastType}:${message}`
    const now = Date.now()
    const lastShown = recentMessages.current.get(key) || 0
    if (now - lastShown < 1200) return

    recentMessages.current.set(key, now)
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8)
    const t = { id, message, type: toastType }
    setToasts(s => [...s, t])
    setTimeout(() => {
      setToasts(s => s.filter(x => x.id !== id))
      recentMessages.current.delete(key)
    }, timeout)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(s => s.filter(x => x.id !== id))
  }, [])

  useEffect(() => {
    const showFromEvent = (event) => {
      const detail = event?.detail || {}
      showToast(detail.message || detail.text, detail.type || 'info', detail.timeout || 4000)
    }

    const showMessageEvent = (event) => {
      const detail = event?.detail || {}
      showToast(detail.message || detail.text, detail.type || 'info', detail.timeout || 5000)
    }

    window.addEventListener('app:toast', showFromEvent)
    window.addEventListener('app:message', showMessageEvent)
    return () => {
      window.removeEventListener('app:toast', showFromEvent)
      window.removeEventListener('app:message', showMessageEvent)
    }
  }, [showToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => {
          const meta = toastMeta[t.type] || toastMeta.info
          const Icon = meta.Icon
          return (
            <div key={t.id} className={`toast ${meta.className}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon className="toast-icon" size={18} />
              <div className="toast-message">{t.message}</div>
              <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss message">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx.showToast
}

export default ToastProvider
