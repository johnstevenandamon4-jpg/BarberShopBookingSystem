import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const TOKEN_KEY = 'barberbook_token'
export const UNAUTHORIZED_EVENT = 'barberbook:unauthorized'
export const NOTIFICATIONS_CHANGED_EVENT = 'barberbook:notifications-changed'

// Small wrapper so a blocked/unavailable localStorage never crashes the app.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

// The single Axios instance used by every service file.
const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

// Attach "Authorization: Bearer <token>" to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 means the token is missing/expired: clear it and tell the app to
// send the user to the login page. (Wrong-password responses are 422, and
// login/register calls are excluded anyway.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthForm = /\/(login|register)$/.test(url)

    if (error.response?.status === 401 && !isAuthForm) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(error)
  }
)

/** A human-readable message for any failed request. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Cannot reach the server. Check that the Laravel API is running.'
  }

  const { status, data } = error.response

  if (status === 403) return data?.message || 'You are not allowed to do that.'
  if (status === 404) return data?.message || 'That record could not be found.'
  if (status >= 500) return 'The server had a problem. Please try again.'

  return (typeof data?.message === 'string' && data.message) || fallback
}

/** Laravel 422 errors → { field: "first message" } for showing under inputs. */
export function getFieldErrors(error) {
  const errors = error?.response?.data?.errors
  if (error?.response?.status !== 422 || !errors) return {}

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ])
  )
}

/** Walk every page of a paginated endpoint (used to fill dropdowns). */
export async function fetchAllPages(url, params = {}) {
  const items = []
  let page = 1
  let lastPage = 1

  do {
    const { data } = await api.get(url, { params: { ...params, page } })
    items.push(...(data.data ?? []))
    lastPage = (data.meta ?? data).last_page ?? 1 // works with plain paginators and API Resources
    page += 1
  } while (page <= lastPage)

  return items
}

export default api
