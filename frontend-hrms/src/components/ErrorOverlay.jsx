import React, { useEffect, useState } from 'react'

export default function ErrorOverlay() {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const msg = e?.detail || {}
      if (!msg.message) return
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      // Keep only the single latest message to prevent stacking over UI
      setMessages([{ id, ...msg }])

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setMessages((m) => m.filter((x) => x.id !== id))
      }, 6000)
    }
    window.addEventListener('app:message', handler)
    return () => window.removeEventListener('app:message', handler)
  }, [])

  function remove(id) {
    setMessages((m) => m.filter((x) => x.id !== id))
  }

  if (messages.length === 0) return null
  if (!import.meta.env.DEV) return null

  return (
    <div className="dev-message-overlay max-w-sm right-4 bottom-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`dev-message border rounded-xl shadow-lg p-3 ${
            m.type === 'error'
              ? 'border-rose-200 bg-white text-rose-800'
              : 'border-amber-200 bg-white text-amber-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-1 text-xs font-bold uppercase tracking-wider">
            <span>{m.type === 'error' ? 'Notice' : 'Warning'}</span>
            <button
              type="button"
              onClick={() => remove(m.id)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1 rounded transition"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-slate-600 line-clamp-3">
            {typeof m.message === 'string' ? m.message : String(m.message || '')}
          </div>
        </div>
      ))}
    </div>
  )
}
