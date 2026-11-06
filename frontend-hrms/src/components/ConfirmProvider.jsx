import React, { createContext, useContext, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'

const ConfirmContext = createContext(null)

export function useConfirm(){
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }){
  const [state, setState] = useState({ open: false, message: '', resolve: null, confirmLabel: 'Confirm', tone: 'danger' })

  const confirm = useCallback((input) => {
    return new Promise((res) => {
      if (typeof input === 'string') {
        setState({ open: true, message: input, resolve: res, confirmLabel: 'Confirm', tone: 'danger' })
        return
      }

      setState({
        open: true,
        message: input?.message || '',
        resolve: res,
        confirmLabel: input?.confirmLabel || 'Confirm',
        tone: input?.tone || 'danger',
      })
    })
  }, [])

  const handle = (ok) => {
    if(state.resolve) state.resolve(ok)
    setState({ open: false, message: '', resolve: null, confirmLabel: 'Confirm', tone: 'danger' })
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && ReactDOM.createPortal(
        <div className="confirm-backdrop">
          <div className="confirm-dialog">
            <div className="confirm-message">{state.message}</div>
            <div className="confirm-actions">
              <button onClick={() => handle(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={() => handle(true)}
                className={`btn btn-sm ${state.tone === 'primary' ? 'btn-primary' : 'btn-danger'}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </ConfirmContext.Provider>
  )
}

export default ConfirmProvider
