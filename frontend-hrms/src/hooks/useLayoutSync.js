import { useEffect, useState, useCallback, useRef } from 'react'
import * as signalR from '@microsoft/signalr'

let globalConnection = null
let connectionPromise = null

/**
 * Singleton connection builder for SignalR layout sync
 */
export function getLayoutSyncConnection() {
  if (globalConnection) return globalConnection

  const hubUrl = '/hubs/layout-sync'

  globalConnection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Information)
    .build()

  return globalConnection
}

/**
 * React hook to listen to real-time UI layout & policy events.
 * Updates Version = Version + 1 across all connected clients instantly.
 */
export function useLayoutSync(pageKey = null) {
  const [isConnected, setIsConnected] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)
  const [lastSyncEvent, setLastSyncEvent] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    const conn = getLayoutSyncConnection()

    const startConnection = async () => {
      if (conn.state === signalR.HubConnectionState.Connected) {
        setIsConnected(true)
        setConnectionStatus('connected')
        return
      }

      if (conn.state === signalR.HubConnectionState.Disconnected) {
        setConnectionStatus('connecting')
        try {
          if (!connectionPromise) {
            connectionPromise = conn.start().finally(() => {
              connectionPromise = null
            })
          }
          await connectionPromise
          if (isMountedRef.current) {
            setIsConnected(true)
            setConnectionStatus('connected')
          }
        } catch (err) {
          console.warn('[LayoutSync] SignalR connection attempt failed:', err)
          if (isMountedRef.current) {
            setIsConnected(false)
            setConnectionStatus('error')
          }
        }
      }
    }

    startConnection()

    // Real-time layout change listener (Version = Version + 1)
    const handleLayoutChanged = (event) => {
      console.log('⚡ [LayoutSync] OnLayoutChanged received:', event)
      if (isMountedRef.current) {
        if (!pageKey || event.pageKey === pageKey) {
          setLatestVersion(event.version)
          setLastSyncEvent(event)
        }
      }

      // Notify entire app via window event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms:layout-synced', { detail: event }))
        window.dispatchEvent(new CustomEvent('hrms:metadata-updated', {
          detail: {
            schemaId: event.pageKey,
            version: event.version,
            action: event.action
          }
        }))
      }
    }

    // Real-time policy change listener
    const handlePolicyChanged = (event) => {
      console.log('⚡ [LayoutSync] OnPolicyChanged received:', event)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms:policy-synced', { detail: event }))
      }
    }

    conn.on('OnLayoutChanged', handleLayoutChanged)
    conn.on('OnPolicyChanged', handlePolicyChanged)

    conn.onreconnecting(() => {
      if (isMountedRef.current) setConnectionStatus('reconnecting')
    })

    conn.onreconnected(() => {
      if (isMountedRef.current) {
        setConnectionStatus('connected')
        setIsConnected(true)
      }
    })

    conn.onclose(() => {
      if (isMountedRef.current) {
        setConnectionStatus('disconnected')
        setIsConnected(false)
      }
    })

    return () => {
      isMountedRef.current = false
      conn.off('OnLayoutChanged', handleLayoutChanged)
      conn.off('OnPolicyChanged', handlePolicyChanged)
    }
  }, [pageKey])

  return {
    isConnected,
    connectionStatus,
    latestVersion,
    lastSyncEvent
  }
}
