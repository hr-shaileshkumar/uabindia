import React from 'react'
import { AlertOctagon, RefreshCw, ArrowLeft, Home } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
    this.handleRetry = this.handleRetry.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Only log to console, avoiding cascading UI exceptions
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleRetry() {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[420px] w-full items-center justify-center p-6 antialiased">
          <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-xl shadow-rose-900/5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
              <AlertOctagon size={28} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              {this.props.title || 'Unable to display this view'}
            </h3>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {this.state.error?.message ||
                'A temporary interface rendering error occurred. You can safely retry or return to the main dashboard.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition active:scale-95 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry View</span>
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                <Home size={13} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
