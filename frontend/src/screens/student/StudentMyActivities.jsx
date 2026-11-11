import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentHeader from '../../components/student/StudentHeader'
import { api } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

const FILTERS = [
  { value: 'all', label: 'All Activities' },
  { value: 'assigned', label: 'Due Soon / Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'remedial', label: 'Needs Remedial Practice' },
]

const STATUS_META = {
  COMPLETED: {
    label: 'Graded • AI Feedback Available',
    pill: 'bg-secondary-container text-on-secondary-container',
    accent: 'bg-secondary',
  },
  REMEDIAL: {
    label: 'Needs Remedial Practice',
    pill: 'bg-error-container text-on-error-container',
    accent: 'bg-error',
  },
  PENDING: {
    label: 'Pending',
    pill: 'bg-error-container text-on-error-container',
    accent: 'bg-primary-container',
  },
  ASSIGNED: {
    label: 'Assigned',
    pill: 'bg-surface-container text-on-surface',
    accent: 'bg-primary-container',
  },
}

function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function scoreLabel(score) {
  if (score === null || score === undefined) return null
  return `${Number(score).toFixed(1)}%`
}

export default function StudentMyActivities() {
  const [activeFilter, setActiveFilter] = useState('all')
  const activities = useApiResource(
    () => api.student.activities(activeFilter),
    [activeFilter]
  )

  const list = Array.isArray(activities.data) ? activities.data : []
  const completed = list.filter((activity) => activity.status === 'COMPLETED')
  const scores = completed
    .map((activity) => Number(activity.score))
    .filter((value) => Number.isFinite(value))
  const averageScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : null

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <StudentHeader active="/student/activities" />
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="max-w-7xl mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex flex-col gap-space-xs">
              <span className="px-2.5 py-1 w-fit rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Assigned Coding Activities
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
                My Activities
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Everything your teacher has published, newest first.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  assignment_turned_in
                </span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                    Completion
                  </span>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">
                    {completed.length} of {list.length} Done
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">insights</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm opacity-80 leading-none">
                    Diagnostic Avg
                  </span>
                  <span className="font-label-lg text-label-lg font-bold">
                    {averageScore === null ? '—' : `${averageScore.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="inline-flex p-1 rounded-2xl bg-surface-container-high max-w-full overflow-x-auto w-fit">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={
                  activeFilter === filter.value
                    ? 'px-4 py-2 rounded-xl font-label-lg text-label-lg font-bold bg-surface-container-lowest text-primary shadow-sm transition-all shrink-0'
                    : 'px-4 py-2 rounded-xl font-label-lg text-label-lg font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all shrink-0'
                }
                onClick={() => setActiveFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {activities.loading && <LoadingBlock label="Loading your activities…" />}
          {activities.error && (
            <DataError error={activities.error} onRetry={activities.reload} />
          )}
          {!activities.loading && !activities.error && list.length === 0 && (
            <EmptyBlock
              icon="assignment"
              title="No activities here yet"
              message="Your teacher has not published an activity for this filter."
            />
          )}
          {!activities.loading &&
            !activities.error &&
            list.map((activity) => {
              const meta = STATUS_META[activity.status] || STATUS_META.ASSIGNED
              const completedActivity = activity.status === 'COMPLETED'
              const link = completedActivity && activity.submissionId
                ? `/student/feedback?submissionId=${activity.submissionId}`
                : `/student/quiz?id=${activity.id}`
              return (
                <article
                  key={activity.id}
                  className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-md"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.accent}`} />
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${meta.pill}`}>
                        {meta.label}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Due {formatDue(activity.dueDate)}
                      </span>
                    </div>
                    {scoreLabel(activity.score) && (
                      <div className="flex items-center gap-1.5 font-label-md text-label-md text-secondary font-bold">
                        <span className="material-symbols-outlined text-[16px]">stars</span>
                        Score: {scoreLabel(activity.score)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md pl-2">
                    <div className="flex flex-col gap-1 max-w-xl">
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {activity.title}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {activity.description || 'No description provided.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                          {activity.questionCount} Questions
                        </span>
                        {activity.topic && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                            {activity.topic}
                          </span>
                        )}
                        {activity.className && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                            {activity.className}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Link
                        className={
                          completedActivity
                            ? 'px-5 py-2.5 rounded-xl bg-primary-container/10 hover:bg-primary-container/20 text-primary font-label-lg text-label-lg font-bold transition-all flex items-center justify-center gap-2'
                            : 'px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary transition-all flex items-center justify-center gap-2'
                        }
                        to={link}
                      >
                        <span>{completedActivity ? 'Review Feedback' : 'Start Activity'}</span>
                        <span className="material-symbols-outlined text-[18px]">
                          {completedActivity ? 'chat_bubble_outline' : 'play_arrow'}
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
        </div>
      </main>
    </div>
  )
}
