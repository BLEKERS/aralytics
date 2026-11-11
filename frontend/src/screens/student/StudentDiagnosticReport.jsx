import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StudentHeader from '../../components/student/StudentHeader'
import { api } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function StudentDiagnosticReport() {
  const [params] = useSearchParams()
  const submissionId = params.get('submissionId')
  const feedback = useApiResource(
    () => (submissionId ? api.student.feedback(submissionId) : Promise.resolve(null)),
    [submissionId]
  )

  const [drill, setDrill] = useState(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillError, setDrillError] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const view = feedback.data
  const pending = view?.status === 'PENDING'

  async function retry() {
    setRetrying(true)
    try {
      const updated = await api.student.retryFeedback(submissionId)
      if (updated?.status === 'READY') feedback.reload()
    } catch {
      feedback.reload()
    } finally {
      setRetrying(false)
    }
  }

  async function startDrill() {
    setDrillLoading(true)
    setDrillError(null)
    try {
      setDrill(await api.student.practiceDrill(submissionId))
    } catch (error) {
      setDrillError(error)
    } finally {
      setDrillLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <StudentHeader active="/student/feedback" />
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="max-w-7xl mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
          {!submissionId && (
            <EmptyBlock
              icon="psychology"
              title="Pick an attempt"
              message="Open a completed activity or your feedback history to view its diagnostic report."
            />
          )}
          {submissionId && feedback.loading && <LoadingBlock label="Loading your diagnostic feedback…" />}
          {submissionId && feedback.error && (
            <DataError error={feedback.error} onRetry={feedback.reload} />
          )}

          {submissionId && view && (
            <>
              <section className="relative overflow-hidden rounded-2xl bg-surface-container-high p-space-lg shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-[28px]">psychology</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                          AI Diagnostic Report
                        </span>
                        <span
                          className={
                            pending
                              ? 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold'
                              : 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold'
                          }
                        >
                          {view.status}
                        </span>
                      </div>
                      <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                        {view.quizTitle}
                      </h1>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Submission #{view.submissionId} · Generated {formatDate(view.generatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pending && (
                      <button
                        className="px-4 py-2 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-lg text-label-lg font-bold hover:brightness-105 transition-all disabled:opacity-50"
                        disabled={retrying}
                        onClick={retry}
                        type="button"
                      >
                        {retrying ? 'Retrying…' : 'Retry Feedback'}
                      </button>
                    )}
                    <Link
                      className="px-4 py-2 rounded-xl bg-surface-container-lowest text-primary font-label-lg text-label-lg font-semibold hover:bg-surface-container transition-all"
                      to={`/student/quiz?id=${view.quizId}`}
                    >
                      View Quiz
                    </Link>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                <section className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">smart_toy</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      Aral Coach Breakdown
                    </h2>
                  </div>
                  {pending ? (
                    <div className="rounded-xl bg-tertiary-fixed/40 p-space-md">
                      <p className="font-body-md text-body-md text-on-surface">
                        Feedback is still being generated. This screen refreshes when you reload, or you
                        can retry now.
                      </p>
                    </div>
                  ) : (
                    <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                      {view.content || 'No diagnostic text was generated for this attempt.'}
                    </p>
                  )}
                </section>

                <aside className="lg:col-span-4 flex flex-col gap-space-lg">
                  <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md flex flex-col gap-space-md">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Concept Mastery</h2>
                    {view.concepts?.length ? (
                      view.concepts.map((concept) => {
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
                      })
                    ) : (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        No concept tags on this activity yet.
                      </p>
                    )}
                  </section>

                  <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md flex flex-col gap-space-md">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Practice Drill</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Three questions drawn from your published activities on the concepts you missed.
                    </p>
                    <button
                      className="w-full py-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-lg text-label-lg font-bold hover:brightness-105 transition-all disabled:opacity-50"
                      disabled={drillLoading || pending}
                      onClick={startDrill}
                      type="button"
                    >
                      {drillLoading ? 'Building drill…' : pending ? 'Available once feedback is ready' : 'Start Practice Drill'}
                    </button>
                    {drillError && <DataError error={drillError} onRetry={startDrill} />}
                    {drill && (
                      <div className="flex flex-col gap-space-md">
                        {drill.questions.length === 0 ? (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            No matching questions were found yet. Ask your teacher to tag more activities
                            with these concepts.
                          </p>
                        ) : (
                          drill.questions.map((question, index) => (
                            <div key={question.id} className="rounded-xl bg-surface-container-low p-space-md flex flex-col gap-2">
                              <span className="font-label-sm text-label-sm text-primary font-bold">
                                Drill {index + 1} · {question.points} pts
                              </span>
                              <p className="font-body-md text-body-md text-on-surface">{question.text}</p>
                              <ul className="flex flex-col gap-1">
                                {question.options.map((option) => (
                                  <li
                                    key={option.key}
                                    className="font-body-sm text-body-sm text-on-surface-variant"
                                  >
                                    <span className="font-bold text-on-surface">{option.key}.</span>{' '}
                                    {option.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
