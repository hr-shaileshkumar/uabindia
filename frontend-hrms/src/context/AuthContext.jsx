import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  // Use uniquely-named storage helpers to avoid accidental collisions during HMR
  function _safeGet(k) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.getItem === 'function') {
        const val = window.sessionStorage.getItem(k)
        if (val) return val
      }
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        return window.localStorage.getItem(k)
      }
    } catch (e) {
      // ignore
    }
    return null
  }

  const _safeSet = (k, v) => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.setItem === 'function') {
        window.sessionStorage.setItem(k, v)
      }
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem(k, v)
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  function _safeRemove(k) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.removeItem === 'function') {
        window.sessionStorage.removeItem(k)
      }
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem(k)
      }
    } catch (e) {
      // ignore
    }
  }

  const [token, setToken] = useState(() => _safeGet('auth_token'))
  const [user, setUser] = useState(() => {
    const raw = _safeGet('auth_user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    // attach token to axios defaults
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      if (typeof _safeSet === 'function') _safeSet('auth_token', token)
      // if token present, try to fetch profile from server
      ;(async ()=>{
        try{
          const resp = await api.get('/auth/me')
          if(resp?.data) { setUser(resp.data); try{ if (typeof _safeSet === 'function') _safeSet('auth_user', JSON.stringify(resp.data)) }catch{} }
        }catch(e){ /* ignore, interceptor will handle 401 */ }
      })()
    } else {
      delete api.defaults.headers.common.Authorization
      _safeRemove('auth_token')

      // Silent SSO Check: If no token in local storage, check if a Central SSO session exists
      ;(async () => {
        try {
          const resp = await api.get('/auth/me')
          const newToken = resp?.data?.token || resp?.data?.access_token
          if (newToken) {
            setToken(newToken)
            if (typeof _safeSet === 'function') _safeSet('auth_token', newToken)
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`
            setUser(resp.data)
            if (typeof _safeSet === 'function') _safeSet('auth_user', JSON.stringify(resp.data))
          }
        } catch (e) {
          // No active SSO session found; user stays logged out
        }
      })()
    }
  }, [token])

  const login = async (credentials) => {
    _safeRemove('auth_token')
    _safeRemove('auth_user')
    delete api.defaults.headers.common.Authorization
    setUser(null)

    const rawUser = (credentials?.userId || credentials?.email || credentials?.username || '').trim()
    const rawPass = (credentials?.password || '').trim()
    const emailVal = rawUser.includes('@') ? rawUser : `${rawUser}@uabindia.in`

    const payloads = [
      {
        email: emailVal,
        username: rawUser,
        userId: rawUser,
        password: rawPass,
        deviceId: 'hrms-web-client'
      },
      {
        email: rawUser,
        password: rawPass,
        deviceId: 'hrms-web-client'
      }
    ]

    const tried = []
    let lastErr = null

    for (const p of payloads) {
      const key = JSON.stringify(p)
      if (tried.includes(key)) continue
      tried.push(key)
      try {
        const resp = await api.post('/auth/login', p)
        const t = resp?.data?.token || resp?.data?.Token || resp?.data?.access_token || resp?.data?.AccessToken
        const u = resp?.data?.user || resp?.data?.User || {
          id: resp?.data?.id || 'admin',
          email: p.email,
          fullName: resp?.data?.fullName || resp?.data?.name || 'Enterprise Admin',
          name: resp?.data?.name || resp?.data?.fullName || 'Enterprise Admin',
          role: resp?.data?.role || 'Admin',
          roles: resp?.data?.roles || ['Admin'],
          companyName: resp?.data?.companyName || 'Uabindia HRMS'
        }
        if (t) {
          setToken(t)
          setUser(u)
          api.defaults.headers.common.Authorization = `Bearer ${t}`
          try { if (typeof _safeSet === 'function') _safeSet('auth_user', JSON.stringify(u)) } catch(e) {}
          const rf = resp?.data?.refresh_token || resp?.data?.RefreshToken
          if (rf && typeof _safeSet === 'function') {
            try { _safeSet('refresh_token', rf) } catch(e) {}
          }
        }
        console.debug('login response', resp?.data)
        return resp
      } catch (err) {
        lastErr = err
        if (err?.response?.status === 401 || err?.response?.status === 400) {
          continue
        }
        throw err
      }
    }

    throw lastErr
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    _safeRemove('auth_token')
    _safeRemove('auth_user')
    _safeRemove('refresh_token')
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('uabindia_sso_channel')
        channel.postMessage({ type: 'SSO_LOGOUT', timestamp: Date.now() })
        channel.close()
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const channel = new BroadcastChannel('uabindia_sso_channel')
    channel.onmessage = (event) => {
      if (event.data?.type === 'SSO_LOGOUT') {
        setToken(null)
        setUser(null)
        _safeRemove('auth_token')
        _safeRemove('auth_user')
        _safeRemove('refresh_token')
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return () => {
      channel.close()
    }
  }, [])

  useEffect(()=>{
    if(!token){ setUser(null); try{ _safeRemove('auth_user'); _safeRemove('refresh_token') }catch{} }
  },[token])

  const value = { token, user, setUser, login, logout, isAuthenticated: !!token }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
