function dispatch(type, message, meta) {
  // Use setTimeout(..., 0) to avoid "Cannot update a component while rendering a different component"
  setTimeout(() => {
    try {
      const text = typeof message === 'string' ? message : (message?.message || 'Application error')
      window.dispatchEvent(new CustomEvent('app:message', { detail: { type, message: text.slice(0, 180), meta } }))
    } catch (e) {
      /* ignore */
    }
  }, 0)
}

export function initGlobalErrorHandler() {
  // Catch uncaught window exceptions
  window.onerror = function (message, source, lineno, colno, error) {
    const filename = source ? source.split('/').pop() : ''
    dispatch('error', `${message}${filename ? ` (${filename}:${lineno})` : ''}`, { stack: error?.stack })
    return false
  }

  // Catch unhandled promise rejections
  window.onunhandledrejection = function (ev) {
    const reason = ev?.reason
    const msg = reason?.response?.data?.message || reason?.message || String(reason || 'Unhandled Promise rejection')
    dispatch('error', msg, { stack: reason?.stack })
  }
}

export default initGlobalErrorHandler
