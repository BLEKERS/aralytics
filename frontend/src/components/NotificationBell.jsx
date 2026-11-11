import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { describeApiError } from './DataState'

function timeAgo(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * In-app notification dropdown. Fetches once on mount and again whenever it
 * opens, so the unread dot reflects the server state.
 */
export default function NotificationBell({
  role = 'student',
  buttonClassName = 'relative p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors',
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ loading: true, error: null, items: [] })
  const requestRef = useRef(0)

  const load = () => {
    const request = ++requestRef.current
    setState((previous) => ({ ...previous, loading: true, error: null }))
    api[role]
      .notifications()
      .then((items) => {
        if (request === requestRef.current) {
          setState({ loading: false, error: null, items: Array.isArray(items) ? items : [] })
        }
      })
      .catch((error) => {
        if (request === requestRef.current) {
          setState({ loading: false, error, items: [] })
        }
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const unread = state.items.some((item) => !item.isRead)
  const problem = state.error ? describeApiError(state.error) : null

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-label="Notifications & Reminders"
        className={buttonClassName}
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) load()
        }}
        title="Notifications"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unread && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        )}
      </button>
      {open && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                Notifications
              </span>
              <button
                className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
                onClick={load}
                title="Refresh"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {state.loading && (
                <p className="px-4 py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
                  Loading notifications…
                </p>
              )}
              {!state.loading && problem && (
                <p className="px-4 py-6 text-center font-body-sm text-body-sm text-error">
                  {problem.title}. {problem.message}
                </p>
              )}
              {!state.loading && !problem && state.items.length === 0 && (
                <p className="px-4 py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
                  No notifications yet.
                </p>
              )}
              {!state.loading &&
                !problem &&
                state.items.map((item) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 border-b border-outline-variant/20 last:border-b-0 ${
                      item.isRead ? '' : 'bg-primary-container/5'
                    }`}
                  >
                    <p className="font-body-sm text-body-sm text-on-surface">{item.message}</p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {timeAgo(item.scheduledAt || item.sentAt)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
