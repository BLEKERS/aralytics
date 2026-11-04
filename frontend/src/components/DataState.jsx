import { API_BASE_URL, ApiError } from '../api/client'

export function describeApiError(error) {
  if (!error) return null
  const status = error instanceof ApiError ? error.status : 0

  if (error.isOffline || status === 0) {
    return {
      icon: 'cloud_off',
      tone: 'error',
      title: 'Backend offline',
      message: `We could not reach the Aralytics server at ${API_BASE_URL}. Start the backend, then retry.`,
      detail: error.message,
    }
  }

  if (status === 501) {
    return {
      icon: 'construction',
      tone: 'warning',
      title: 'Not available in this version',
      message: 'This feature is planned for a later milestone of the pilot.',
      detail: null,
    }
  }

  if (status === 401) {
    return {
      icon: 'lock',
      tone: 'warning',
      title: 'Session expired',
      message: 'Please sign in again to continue.',
      detail: null,
    }
  }

  if (status === 403) {
    return {
      icon: 'shield',
      tone: 'warning',
      title: 'Access denied',
      message: 'Your account does not have permission to view this data.',
      detail: error.message,
    }
  }

  if (status === 404) {
    return {
      icon: 'search_off',
      tone: 'warning',
      title: 'Nothing found',
      message: 'The requested record does not exist or is no longer available.',
      detail: error.message,
    }
  }

  return {
    icon: 'error',
    tone: 'error',
    title: 'Something went wrong',
    message: error.message || 'The request could not be completed.',
    detail: null,
  }
}

const TONE_CLASSES = {
  error: {
    wrapper: 'bg-error-container/40 border-error/20 text-on-surface',
    icon: 'bg-error-container text-error',
    title: 'text-error',
  },
  warning: {
    wrapper: 'bg-tertiary-fixed/40 border-tertiary/20 text-on-surface',
    icon: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'text-tertiary',
  },
}

/** Inline error/offline/501 panel with a retry action. */
export function DataError({ error, onRetry, className = '' }) {
  const info = describeApiError(error)
  if (!info) return null
  const tone = TONE_CLASSES[info.tone] || TONE_CLASSES.error

  return (
    <div
      className={`rounded-2xl border p-space-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm ${tone.wrapper} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-space-sm min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
          <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
        </div>
        <div className="min-w-0">
          <p className={`font-label-lg text-label-lg font-bold ${tone.title}`}>{info.title}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{info.message}</p>
          {info.detail && info.detail !== info.message && (
            <p className="font-body-sm text-body-sm text-outline mt-0.5 break-words">{info.detail}</p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors shrink-0 shadow-sm"
          onClick={onRetry}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
      )}
    </div>
  )
}

/** Compact loading state that can be dropped into a card or page section. */
export function LoadingBlock({ label = 'Loading from Aralytics…', className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-space-md py-space-sm rounded-2xl bg-surface-container-low text-on-surface-variant ${className}`}>
      <span className="material-symbols-outlined text-[20px] animate-spin text-primary">progress_activity</span>
      <span className="font-body-sm text-body-sm font-medium">{label}</span>
    </div>
  )
}

/** Neutral empty state for a successfully loaded but empty collection. */
export function EmptyBlock({ icon = 'inbox', title = 'Nothing here yet', message, className = '' }) {
  return (
    <div className={`rounded-2xl bg-surface-container-low p-space-lg text-center flex flex-col items-center gap-2 ${className}`}>
      <span className="material-symbols-outlined text-[28px] text-on-surface-variant">{icon}</span>
      <p className="font-label-lg text-label-lg font-bold text-on-surface">{title}</p>
      {message && <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{message}</p>}
    </div>
  )
}
