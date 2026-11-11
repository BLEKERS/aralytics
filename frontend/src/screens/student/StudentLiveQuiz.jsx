import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StudentHeader from '../../components/student/StudentHeader'
import { api } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function StudentLiveQuiz() {
  const [params] = useSearchParams()
  const quizId = params.get('id')
  const quiz = useApiResource(
    () => (quizId ? api.student.quiz(quizId) : Promise.resolve(null)),
    [quizId]
  )

  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [savingId, setSavingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const questions = Array.isArray(quiz.data?.questions) ? quiz.data.questions : []
  const question = questions[current] || null
  const answeredCount = questions.filter((item) => answers[item.id]).length

  useEffect(() => {
    if (quiz.data?.submitted) return undefined
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(interval)
  }, [quiz.data?.submitted])

  useEffect(() => {
    if (!quiz.data?.questions) return
    const saved = {}
    quiz.data.questions.forEach((item) => {
      if (item.savedAnswer) saved[item.id] = item.savedAnswer
    })
    setAnswers(saved)
  }, [quiz.data])

  async function chooseOption(optionKey) {
    if (!question || quiz.data?.submitted || savingId) return
    const previous = answers[question.id]
    setAnswers((value) => ({ ...value, [question.id]: optionKey }))
    setSavingId(question.id)
    setActionError(null)
    try {
      await api.student.saveAnswer(quizId, {
        questionId: question.id,
        selectedOption: optionKey,
      })
    } catch (error) {
      setAnswers((value) => ({ ...value, [question.id]: previous }))
      setActionError(error)
    } finally {
      setSavingId(null)
    }
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setActionError(null)
    try {
      const payload = questions
        .filter((item) => answers[item.id])
        .map((item) => ({ questionId: item.id, selectedOption: answers[item.id] }))
      const response = await api.student.submit(quizId, payload)
      setResult(response)
      quiz.reload()
    } catch (error) {
      setActionError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const submitted = Boolean(quiz.data?.submitted) || Boolean(result)
  const feedbackHref = (result?.submissionId || quiz.data?.submissionId)
    ? `/student/feedback?submissionId=${result?.submissionId || quiz.data?.submissionId}`
    : '/student/progress'
  const minutes = Math.floor(seconds / 60)
  const secondsLabel = String(seconds % 60).padStart(2, '0')

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <StudentHeader active="/student/quiz" />
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="max-w-7xl mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
          {!quizId && (
            <EmptyBlock
              icon="quiz"
              title="Choose an activity first"
              message="Open an activity from My Activities to start a quiz."
            />
          )}
          {quizId && quiz.loading && <LoadingBlock label="Loading your quiz…" />}
          {quizId && quiz.error && <DataError error={quiz.error} onRetry={quiz.reload} />}

          {quizId && quiz.data && (
            <>
              <section className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                    {quiz.data.className || 'Activity'}
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
                    {quiz.data.title}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {quiz.data.description || 'Answer every question, then submit.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-surface-container-low font-label-md text-label-md">
                    Due {formatDue(quiz.data.dueDate)}
                  </span>
                  {!submitted && (
                    <span className="px-3 py-1.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-bold">
                      {minutes}m {secondsLabel}s
                    </span>
                  )}
                </div>
              </section>

              {submitted && (
                <section className="rounded-xl bg-secondary-container text-on-secondary-container p-space-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm font-bold">Submitted</h2>
                    <p className="font-body-md text-body-md">
                      Score: {Number(result?.score ?? quiz.data.score ?? 0).toFixed(1)}% ·{' '}
                      Feedback: {result?.feedbackStatus || quiz.data.feedbackStatus || 'PENDING'}
                    </p>
                  </div>
                  <Link
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all"
                    to={feedbackHref}
                  >
                    View AI Feedback
                  </Link>
                </section>
              )}

              {actionError && (
                <DataError error={actionError} onRetry={() => setActionError(null)} />
              )}

              {!submitted && questions.length > 0 && question && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                  <section className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        Question {current + 1} of {questions.length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {question.points} {question.points === 1 ? 'point' : 'points'}
                        {savingId === question.id && ' · Saving…'}
                      </span>
                    </div>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {question.text}
                    </h2>
                    <div className="flex flex-col gap-2">
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option.key
                        return (
                          <button
                            key={option.key}
                            className={
                              selected
                                ? 'text-left px-4 py-3 rounded-xl border-2 border-primary bg-primary-container/10 font-body-md text-body-md transition-all'
                                : 'text-left px-4 py-3 rounded-xl border-2 border-transparent bg-surface-container-low hover:bg-surface-container font-body-md text-body-md transition-all'
                            }
                            onClick={() => chooseOption(option.key)}
                            type="button"
                          >
                            <span className="font-bold text-primary mr-2">{option.key}.</span>
                            {option.text}
                          </button>
                        )
                      })}
                    </div>
                    {question.concepts?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {question.concepts.map((concept) => (
                          <span
                            key={concept}
                            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm"
                          >
                            #{concept}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container font-label-md text-label-md font-semibold transition-all disabled:opacity-40"
                        disabled={current === 0}
                        onClick={() => setCurrent((value) => Math.max(0, value - 1))}
                        type="button"
                      >
                        Previous
                      </button>
                      {current < questions.length - 1 ? (
                        <button
                          className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-all"
                          onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}
                          type="button"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all disabled:opacity-40"
                          disabled={submitting || answeredCount === 0}
                          onClick={submit}
                          type="button"
                        >
                          {submitting ? 'Submitting…' : 'Submit Quiz'}
                        </button>
                      )}
                    </div>
                  </section>

                  <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Progress
                      </h3>
                      <span className="font-label-md text-label-md text-primary font-bold">
                        {answeredCount}/{questions.length}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.map((item, index) => (
                        <button
                          key={item.id}
                          className={
                            index === current
                              ? 'h-9 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold'
                              : answers[item.id]
                                ? 'h-9 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold'
                                : 'h-9 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm'
                          }
                          onClick={() => setCurrent(index)}
                          type="button"
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-lg text-label-lg font-bold transition-all disabled:opacity-40"
                      disabled={submitting || answeredCount === 0}
                      onClick={submit}
                      type="button"
                    >
                      {submitting ? 'Submitting…' : `Submit ${answeredCount} Answer${answeredCount === 1 ? '' : 's'}`}
                    </button>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Answers save as you go. You can submit with unanswered questions, but they score zero.
                    </p>
                  </aside>
                </div>
              )}

              {!submitted && questions.length === 0 && (
                <EmptyBlock
                  icon="quiz"
                  title="This quiz has no questions"
                  message="Ask your teacher to add questions and publish it again."
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
