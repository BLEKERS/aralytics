// Central API client for the Aralytics Spring Boot backend.
// The base URL can be overridden at build time with VITE_API_BASE_URL.
const DEFAULT_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')

const SESSION_KEY = 'aralytics.auth'
const DEFAULT_TIMEOUT_MS = 15000

/**
 * Normalized error used by every screen. Network failures and timeouts are
 * marked `isOffline` so the UI can show a "Backend offline" state instead of
 * a blank screen.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, problem = null, isOffline = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    this.isOffline = isOffline
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  get isConflict() {
    return this.status === 409
  }

  get isNotImplemented() {
    return this.status === 501
  }
}

export function isNotImplemented(error) {
  return error instanceof ApiError && error.isNotImplemented
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session || typeof session.token !== 'string') return null
    return session
  } catch {
    return null
  }
}

export function saveSession(authResponse) {
  if (!authResponse?.token) return null
  const session = {
    token: authResponse.token,
    tokenType: authResponse.tokenType || 'Bearer',
    expiresAt: authResponse.expiresAt || null,
    user: authResponse.user || null,
    classes: authResponse.classes || [],
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function getToken() {
  return getSession()?.token || null
}

export function getStoredUser() {
  return getSession()?.user || null
}

export function getStoredClasses() {
  return getSession()?.classes || []
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/** Clears local state immediately, then best-effort revokes the token. */
export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } catch {
    // Logout is intentionally best-effort: the local token is removed anyway.
  } finally {
    clearSession()
  }
}

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

function parseBody(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function offlineError(cause, timedOut) {
  return new ApiError(
    timedOut
      ? `The Aralytics server at ${API_BASE_URL} took too long to respond.`
      : `Could not reach the Aralytics server at ${API_BASE_URL}.`,
    { status: 0, isOffline: true, problem: cause ? { cause: String(cause) } : null }
  )
}

/**
 * Low-level JSON request wrapper.
 * - Adds `Authorization: Bearer <token>` when a session exists.
 * - Normalizes network failures/timeouts into `ApiError` with `isOffline`.
 * - Redirects to /login on an expired/invalid token.
 */
export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    query,
    headers,
    auth = true,
    timeout = DEFAULT_TIMEOUT_MS,
    redirectOnUnauthorized = true,
  } = {}
) {
  const token = auth ? getToken() : null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, application/problem+json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    const timedOut = error?.name === 'AbortError'
    throw offlineError(error, timedOut)
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  const payload = parseBody(text)

  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized) {
      clearSession()
      redirectToLogin()
    }
    const detail =
      (payload && typeof payload === 'object' && (payload.detail || payload.title)) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with status ${response.status}.`
    throw new ApiError(detail, { status: response.status, problem: payload })
  }

  return payload
}

/**
 * Downloads a binary response (CSV/PDF export). Uses the same auth header as
 * `apiRequest` but keeps the body as a Blob instead of parsing JSON.
 */
export async function apiDownload(path, { query } = {}) {
  const token = getToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      signal: controller.signal,
      headers: {
        Accept: 'text/csv, application/pdf, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (error) {
    throw offlineError(error, error?.name === 'AbortError')
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession()
      redirectToLogin()
    }
    const text = await response.text()
    const detail =
      parseBody(text)?.detail || `Download failed with status ${response.status}.`
    throw new ApiError(detail, { status: response.status })
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";]+)"?/i)
  return { blob: await response.blob(), filename: match ? match[1] : null }
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* Endpoint map                                                        */
/* ------------------------------------------------------------------ */

export const api = {
  auth: {
    login(credentials) {
      return apiRequest('/api/auth/login', {
        method: 'POST',
        body: credentials,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
    verifyKey(payload) {
      return apiRequest('/api/auth/verify-key', {
        method: 'POST',
        body: payload,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
    activate(payload) {
      return apiRequest('/api/auth/activate', {
        method: 'POST',
        body: payload,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
    forgotPassword(payload) {
      return apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: payload,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
    resetPassword(payload) {
      return apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: payload,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
    me() {
      return apiRequest('/api/auth/me')
    },
    profile() {
      return apiRequest('/api/auth/profile')
    },
    async updateProfile(payload) {
      const me = await apiRequest('/api/auth/profile', { method: 'PUT', body: payload })
      const session = getSession()
      if (session && me?.user) saveSession({ ...session, ...me })
      return me
    },
    changePassword(payload) {
      return apiRequest('/api/auth/profile/password', { method: 'PUT', body: payload })
    },
    logout() {
      return apiRequest('/api/auth/logout', { method: 'POST' })
    },
  },
  public: {
    pilotInquiry(payload) {
      return apiRequest('/api/public/pilot-inquiry', {
        method: 'POST',
        body: payload,
        auth: false,
        redirectOnUnauthorized: false,
      })
    },
  },
  teacher: {
    dashboard(query) {
      return apiRequest('/api/teacher/dashboard', { query })
    },
    students(query) {
      return apiRequest('/api/teacher/students', { query })
    },
    student(studentId) {
      return apiRequest(`/api/teacher/students/${studentId}`)
    },
    activities(query) {
      return apiRequest('/api/teacher/activities', { query })
    },
    createActivity(payload) {
      return apiRequest('/api/teacher/activities', { method: 'POST', body: payload })
    },
    updateActivity(activityId, payload) {
      return apiRequest(`/api/teacher/activities/${activityId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    publishActivity(activityId) {
      return apiRequest(`/api/teacher/activities/${activityId}/publish`, { method: 'POST' })
    },
    settings() {
      return apiRequest('/api/teacher/settings')
    },
    updateSettings(payload) {
      return apiRequest('/api/teacher/settings', { method: 'PUT', body: payload })
    },
    exportCsv(query) {
      return apiDownload('/api/teacher/reports/export-csv', { query })
    },
    exportPdf(query) {
      return apiDownload('/api/teacher/reports/export-pdf', { query })
    },
    notifications() {
      return apiRequest('/api/teacher/notifications')
    },
  },
  student: {
    dashboard() {
      return apiRequest('/api/student/dashboard')
    },
    progress() {
      return apiRequest('/api/student/progress')
    },
    history(search) {
      return apiRequest('/api/student/progress/history', { query: { search } })
    },
    activities(category = 'all') {
      return apiRequest('/api/student/activities', { query: { category } })
    },
    quiz(quizId) {
      return apiRequest(`/api/student/quiz/${quizId}`)
    },
    saveAnswer(quizId, answer) {
      return apiRequest(`/api/student/quiz/${quizId}/answer`, {
        method: 'PATCH',
        body: answer,
      })
    },
    submit(quizId, answers) {
      return apiRequest(`/api/student/quiz/${quizId}/submit`, {
        method: 'POST',
        body: { answers },
        timeout: 30000,
      })
    },
    feedback(submissionId) {
      return apiRequest(`/api/student/feedback/${submissionId}`)
    },
    retryFeedback(submissionId) {
      return apiRequest(`/api/student/feedback/${submissionId}/retry`, { method: 'POST' })
    },
    practiceDrill(submissionId) {
      return apiRequest(`/api/student/feedback/${submissionId}/practice-drill`, {
        method: 'POST',
      })
    },
    notifications() {
      return apiRequest('/api/student/notifications')
    },
  },
}
