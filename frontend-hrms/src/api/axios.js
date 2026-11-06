import axios from 'axios'



function getCookie(name) {

  if (typeof document === 'undefined') return ''

  const parts = document.cookie.split('; ').map(p => p.split('='))

  const found = parts.find(p => p[0] === name)

  return found ? decodeURIComponent(found[1] || '') : ''

}



// safer storage helpers: prefer sessionStorage over localStorage for auth tokens

function _safeGet(k) {

  try {

    if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.getItem === 'function') {

      const val = window.sessionStorage.getItem(k)

      if (val) return val

    }

    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {

      return window.localStorage.getItem(k)

    }

  } catch (e) { /* ignore */ }

  return null

}

function _safeSet(k, v) {

  try {

    if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.setItem === 'function') {

      window.sessionStorage.setItem(k, v)

    }

    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {

      window.localStorage.setItem(k, v)

    }

  } catch (e) { /* ignore */ }

}

function _safeRemove(k) {

  try {

    if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.removeItem === 'function') {

      window.sessionStorage.removeItem(k)

    }

    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {

      window.localStorage.removeItem(k)

    }

  } catch (e) { /* ignore */ }

}



function _safeLocalGet(k) {

  try {

    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {

      return window.localStorage.getItem(k)

    }

  } catch (e) { /* ignore */ }

  return null

}



function isGuid(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))

}



const api = axios.create({

  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',

  headers: {

    'Content-Type': 'application/json',

  },

  // send cookies (refresh token) along with requests

  withCredentials: true,

})



function requestPath(config) {

  const raw = String(config?.url || '')

  try {

    const base = config?.baseURL || import.meta.env.VITE_API_BASE_URL || '/api'

    return new URL(raw, new URL(base, window.location.origin)).pathname

  } catch (e) {

    return raw

  }

}



function isAuthEndpoint(config, endpoints) {

  const path = requestPath(config).toLowerCase()

  return endpoints.some(endpoint => path.endsWith(endpoint))

}



function shouldSkipRefresh(config) {

  return isAuthEndpoint(config, [

    '/auth/login',

    '/auth/refresh',

    '/auth/generate-otp',

    '/auth/verify-otp',

    '/auth/revoke',

    '/branding/current',

    '/branding',

  ])

}



function isLoginRequest(config) {

  return isAuthEndpoint(config, ['/auth/login'])

}



function isMutationRequest(config) {

  const method = String(config?.method || 'get').toLowerCase()

  return ['post', 'put', 'patch', 'delete'].includes(method)

}



function shouldSkipSuccessToast(config) {

  if (!isMutationRequest(config)) return true

  if (config?.skipSuccessToast) return true

  return isAuthEndpoint(config, [

    '/auth/login',

    '/auth/refresh',

    '/auth/generate-otp',

    '/auth/verify-otp',

    '/auth/revoke',

    '/branding/current',

    '/branding',

  ])

}



function mutationSuccessMessage(config, response) {

  const explicit = config?.successMessage || response?.data?.message || response?.data?.Message

  if (explicit) return explicit



  const method = String(config?.method || '').toLowerCase()

  if (method === 'delete') return 'Deleted successfully'

  if (method === 'post') return 'Saved successfully'

  if (method === 'put' || method === 'patch') return 'Changes saved successfully'

  return 'Saved successfully'

}



function validationErrorMessage(errors) {

  if (!errors || typeof errors !== 'object') return ''

  return Object.entries(errors)

    .flatMap(([field, messages]) => {

      const list = Array.isArray(messages) ? messages : [messages]

      return list.filter(Boolean).map(message => `${field}: ${message}`)

    })

    .slice(0, 3)

    .join('; ')

}



function apiErrorMessage(error) {

  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) return data



  const message = data?.message || data?.Message || data?.detail || data?.title

  const validation = validationErrorMessage(data?.errors)

  if (message && validation) return `${message}: ${validation}`

  if (message) return message

  if (validation) return validation

  return error?.message || 'API request failed'

}



function dispatchToast(type, message, timeout) {

  try {

    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, message, timeout } }))

  } catch (e) {

    console.error(e)

  }

}



let isRefreshing = false

let failedQueue = []



const processQueue = (error, token = null) => {

  failedQueue.forEach(prom => {

    if (error) prom.reject(error)

    else prom.resolve(token)

  })

  failedQueue = []

}



// Attach Authorization header from sessionStorage if present

api.interceptors.request.use((config) => {

  try {

    const t = _safeGet('auth_token')

    if (t && !config.headers.Authorization) {

      config.headers.Authorization = `Bearer ${t}`

    }

    // Attach CSRF header when calling refresh endpoint

    const csrf = getCookie('csrfToken')

    if (csrf) config.headers['X-CSRF-Token'] = csrf



    const selectedCompanyId = _safeLocalGet('sel_company_id')

    const selectedProjectId = _safeLocalGet('sel_project_id')

    const selectedTenantId = _safeLocalGet('sel_tenant_id')

    if (isGuid(selectedTenantId)) {

      config.headers['X-Tenant-Id'] = selectedTenantId

    } else {

      delete config.headers['X-Tenant-Id']

    }

    if (isGuid(selectedCompanyId)) {

      config.headers['X-Company-Id'] = selectedCompanyId

    } else {

      delete config.headers['X-Company-Id']

    }

    if (isGuid(selectedProjectId)) {

      config.headers['X-Project-Id'] = selectedProjectId

    } else {

      delete config.headers['X-Project-Id']

    }

  } catch (e) {

    // surface request errors to global overlay

    try { window.dispatchEvent(new CustomEvent('app:message', { detail: { type: 'error', message: 'Request interceptor error: ' + (e && e.message ? e.message : String(e)) } })) } catch(err){ console.error(err) }

  }

  return config

})



// Response interceptor handles 401 by attempting refresh (using cookie-based refreshToken)

api.interceptors.response.use(

  (response) => response,

  (error) => {

    const originalRequest = error.config

    if (!originalRequest) return Promise.reject(error)



    if (error.response && error.response.status === 401 && shouldSkipRefresh(originalRequest)) {

      return Promise.reject(error)

    }



    if (error.response && error.response.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {

        return new Promise(function (resolve, reject) {

          failedQueue.push({ resolve, reject })

        })

          .then((token) => {

            originalRequest.headers.Authorization = 'Bearer ' + token

            return api(originalRequest)

          })

          .catch((err) => Promise.reject(err))

      }



      originalRequest._retry = true

      isRefreshing = true



      return new Promise((resolve, reject) => {

        (async () => {

          try {

            // call refresh endpoint; backend reads refreshToken cookie and csrfToken cookie

            const resp = await axios.post((import.meta.env.VITE_API_BASE_URL || '/api/v1') + '/auth/refresh', { refreshToken: _safeGet('refresh_token') || _safeLocalGet('refresh_token') || '' }, { withCredentials: true, headers: { 'X-CSRF-Token': getCookie('csrfToken') } })

            const newToken = resp?.data?.token || resp?.data?.Token

            if (newToken) {

              try { _safeSet('auth_token', newToken) } catch (e) { console.error(e) }

              api.defaults.headers.common.Authorization = `Bearer ${newToken}`

              originalRequest.headers.Authorization = `Bearer ${newToken}`

              processQueue(null, newToken)

              resolve(api(originalRequest))

            } else {

              processQueue(new Error('No token in refresh response'), null)

              // clear stored auth and redirect to login

              try { _safeRemove('auth_token'); _safeRemove('auth_user') } catch (e) { console.error(e) }

              if (window.location.pathname !== '/login') window.location.href = '/login'

              reject(error)

            }

          } catch (err) {

            processQueue(err, null)

            try { _safeRemove('auth_token'); _safeRemove('auth_user') } catch (e) { console.error(e) }

            if (window.location.pathname !== '/login') window.location.href = '/login'

            reject(err)

          } finally {

            isRefreshing = false

          }

        })()

      })

    }



    return Promise.reject(error)

  }

)



// Surface every successful write through the shared screen toast.

api.interceptors.response.use((response) => {

  try {

    if (!shouldSkipSuccessToast(response?.config)) {

      dispatchToast('success', mutationSuccessMessage(response.config, response), 3500)

    }

  } catch (e) {

    console.error(e)

  }

  return response

})



// attach a generic error handler to surface API errors

api.interceptors.response.use(undefined, (error) => {

  try{

    if (isLoginRequest(error?.config)) return Promise.reject(error)

    if (

      error?.config?.skipErrorToast ||

      error?.config?.silent ||

      error?.config?.url?.includes('/schemas/') ||

      error?.config?.url?.includes('/ui-layout/')

    ) {

      return Promise.reject(error)

    }

    const msg = apiErrorMessage(error)

    if (window.location.pathname === '/login' && /token|csrf|expired|revoked/i.test(msg)) {

      return Promise.reject(error)

    }

    window.dispatchEvent(new CustomEvent('app:message', { detail: { type: 'error', message: msg, meta: { status: error?.response?.status } } }))

  }catch(e){ console.error(e) }

  return Promise.reject(error)

})



export default api

