import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentHeader from '../../components/student/StudentHeader'
import { api } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

function average(concepts) {
  if (!concepts?.length) return null
  const total = concepts.reduce((sum, concept) => sum + Number(concept.masteryLevel || 0), 0)
  return Math.round(total / concepts.length)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function StudentProgressHistory() {
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const history = useApiResource(() => api.student.history(search || undefined), [search])

  const items = Array.isArray(history.data?.items) ? history.data.items : []
  const concepts = Array.isArray(history.data?.concepts) ? history.data.concepts : []
  const overall = average(concepts)
  const sorted = [...concepts].sort(
    (left, right) => Number(right.masteryLevel) - Number(left.masteryLevel)
  )
  const strongest = sorted[0] || null
  const weakest = sorted[sorted.length - 1] || null
  const pendingCount = items.filter((item) => item.feedbackStatus !== 'READY').length
  const scored = items.filter((item) => item.score !== null && item.score !== undefined)
  const averageScore = scored.length
    ? scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length
    : null

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <StudentHeader active="/student/progress" />
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="max-w-7xl mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <span className="px-2.5 py-1 w-fit rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                Diagnostic Analytics &amp; Interventions
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                My Learning Progress &amp; Feedback History
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Track mastery across concepts and revisit every past attempt.
              </p>
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setSearch(input.trim())
              }}
            >
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  className="bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-10 pr-4 py-2.5 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Search by activity title…"
                  type="search"
                  value={input}
                />
              </div>
              <button
                className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-all"
                type="submit"
              >
                Search
              </button>
            </form>
          </div>

          {history.loading && <LoadingBlock label="Loading your progress…" />}
          {history.error && <DataError error={history.error} onRetry={history.reload} />}

          {!history.loading && !history.error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                <StatCard
                  icon="verified"
                  label="Overall Concept Mastery"
                  value={overall === null ? '—' : `${overall}%`}
                  hint={`${concepts.length} tracked concepts`}
                  bar={overall}
                />
                <StatCard
                  icon="assignment_turned_in"
                  label="Activities Completed"
                  value={items.length}
                  hint={`${pendingCount} awaiting feedback`}
                />
                <StatCard
                  icon="trending_up"
                  label="Average Score"
                  value={averageScore === null ? '—' : `${averageScore.toFixed(1)}%`}
                  hint={strongest ? `Strongest: ${strongest.concept}` : 'No attempts yet'}
                />
                <StatCard
                  icon="flag"
                  label="Focus Area"
                  value={weakest ? `${Math.round(Number(weakest.masteryLevel))}%` : '—'}
                  hint={weakest ? weakest.concept : 'Take an activity to see gaps'}
                />
              </div>

              <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Concept Mastery</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Updated from every submission
                  </span>
                </div>
                {concepts.length === 0 ? (
                  <EmptyBlock
                    icon="school"
                    title="No mastery data yet"
                    message="Submit a published activity to start building your concept profile."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {sorted.map((concept) => {
                      const pct = Math.max(0, Math.min(100, Math.round(concept.masteryLevel)))
                      return (
                        <div key={concept.conceptId ?? concept.concept} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between font-label-md text-label-md">
                            <span className="text-on-surface">{concept.concept}</span>
                            <span className={pct >= 70 ? 'text-secondary font-bold' : 'text-tertiary font-bold'}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 70 ? 'bg-secondary' : 'bg-tertiary-fixed-dim'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Feedback History</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {search ? `Filtered by “${search}”` : 'All attempts'}
                  </span>
                </div>
                {items.length === 0 ? (
                  <EmptyBlock
                    icon="history"
                    title={search ? 'No matching attempts' : 'No attempts yet'}
                    message={
                      search
                        ? 'Try a different activity title.'
                        : 'Your submitted activities and their AI feedback will appear here.'
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-space-sm">
                    {items.map((item) => (
                      <Link
                        key={item.submissionId}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                        to={`/student/feedback?submissionId=${item.submissionId}`}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                            {item.quizTitle}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Submitted {formatDate(item.submittedAt)} ·{' '}
                            {item.feedbackStatus === 'READY' ? 'Feedback ready' : 'Feedback pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.score !== null && item.score !== undefined && (
                            <span className="font-headline-sm text-headline-sm font-bold text-primary">
                              {Number(item.score).toFixed(1)}%
                            </span>
                          )}
                          <span
                            className={
                              item.feedbackStatus === 'READY'
                                ? 'px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold'
                                : 'px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold'
                            }
                          >
                            {item.feedbackStatus}
                          </span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                            chevron_right
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, hint, bar }) {
  return (
    <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_16px_rgba(91,75,219,0.06)] flex flex-col justify-between gap-space-sm">
      <div className="flex items-start justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant font-medium">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
      </div>
      <span className="font-metric-number text-metric-number text-primary">{value}</span>
      <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>
      {typeof bar === 'number' && (
        <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  )
}
