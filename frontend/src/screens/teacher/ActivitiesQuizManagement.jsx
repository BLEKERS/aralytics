import { useRef, useState } from 'react'
import { api, getStoredClasses } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'CLOSED', label: 'Closed' },
]

const STATUS_META = {
  PUBLISHED: 'bg-secondary-container text-on-secondary-container',
  DRAFT: 'bg-tertiary-fixed text-on-tertiary-fixed',
  CLOSED: 'bg-surface-container-high text-on-surface-variant',
}

const OPTION_KEYS = ['A', 'B', 'C', 'D']

function emptyQuestion() {
  return {
    text: '',
    options: OPTION_KEYS.map((key) => ({ key, text: '' })),
    correctAnswer: 'A',
    points: 1,
    concepts: '',
  }
}

function emptyForm() {
  return {
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    questions: [emptyQuestion()],
  }
}

function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ActivitiesQuizManagement() {
  const [status, setStatus] = useState('all')
  const classes = getStoredClasses()
  const activities = useApiResource(
    () => api.teacher.activities(status === 'all' ? undefined : { status }),
    [status]
  )
  const [drawer, setDrawer] = useState(null) // { mode: 'create' | 'edit', activity? }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const list = Array.isArray(activities.data) ? activities.data : []

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function openCreate() {
    setForm({ ...emptyForm(), classId: classes[0]?.id ? String(classes[0].id) : '' })
    setFormError(null)
    setDrawer({ mode: 'create' })
  }

  function openEdit(activity) {
    setForm({
      title: activity.title,
      description: activity.description || '',
      classId: activity.classId ? String(activity.classId) : '',
      dueDate: activity.dueDate ? activity.dueDate.slice(0, 16) : '',
      questions: [emptyQuestion()],
    })
    setFormError(null)
    setDrawer({ mode: 'edit', activity })
  }

  function closeDrawer() {
    setDrawer(null)
    setFormError(null)
  }

  function updateQuestion(index, patch) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === index ? { ...question, ...patch } : question
      ),
    }))
  }

  function updateOption(questionIndex, optionKey, text) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === questionIndex
          ? {
              ...question,
              options: question.options.map((option) =>
                option.key === optionKey ? { ...option, text } : option
              ),
            }
          : question
      ),
    }))
  }

  async function submitForm() {
    setFormError(null)
    if (!form.title.trim()) {
      setFormError(new Error('Title is required.'))
      return
    }
    if (!form.classId) {
      setFormError(new Error('Pick a class.'))
      return
    }
    let payload
    if (drawer.mode === 'create') {
      const questions = form.questions.map((question) => ({
        text: question.text,
        options: question.options.filter((option) => option.text.trim()),
        correctAnswer: question.correctAnswer,
        points: Number(question.points) || 1,
        concepts: question.concepts
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      }))
      if (questions.some((question) => !question.text.trim() || question.options.length < 2)) {
        setFormError(new Error('Every question needs text and at least two options.'))
        return
      }
      payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        classId: Number(form.classId),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        questions,
      }
    } else {
      payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        classId: Number(form.classId),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      }
    }

    setSaving(true)
    try {
      if (drawer.mode === 'create') {
        await api.teacher.createActivity(payload)
        notify('Draft created. Publish it when you are ready.')
      } else {
        await api.teacher.updateActivity(drawer.activity.id, payload)
        notify('Draft details updated.')
      }
      closeDrawer()
      activities.reload()
    } catch (error) {
      setFormError(error)
    } finally {
      setSaving(false)
    }
  }

  async function publish(activity) {
    setBusyId(activity.id)
    try {
      await api.teacher.publishActivity(activity.id)
      notify(`Published “${activity.title}”. Students are notified.`)
      activities.reload()
    } catch (error) {
      notify(error.message || 'Could not publish the activity.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-space-md lg:px-space-lg py-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 w-fit rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[15px]">code</span>
              Coding Activities
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Coding Activities &amp; Quizzes
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Create a draft, add questions, then publish it to notify enrolled students.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-space-lg py-2.5 rounded-[14px] bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary transition-all shrink-0"
            onClick={openCreate}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Activity</span>
          </button>
        </div>

        <div className="flex items-center p-1 rounded-full bg-surface-container gap-1 overflow-x-auto w-fit max-w-full">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-colors shrink-0 ${
                status === filter.value
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setStatus(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        {activities.loading && <LoadingBlock label="Loading activities…" />}
        {activities.error && <DataError error={activities.error} onRetry={activities.reload} />}
        {!activities.loading && !activities.error && list.length === 0 && (
          <EmptyBlock
            icon="assignment"
            title="No activities yet"
            message="Create your first activity to get started."
          />
        )}

        {!activities.loading && !activities.error && list.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {list.map((activity) => (
              <article
                key={activity.id}
                className="flex flex-col justify-between rounded-[20px] bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all gap-space-md"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                      {activity.className || `Class #${activity.classId}`}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${
                        STATUS_META[activity.status] || STATUS_META.CLOSED
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      {activity.title}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {activity.description || 'No description.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                    <span>{activity.questionCount} Questions</span>
                    <span>•</span>
                    <span>{activity.totalPoints} Points</span>
                    <span>•</span>
                    <span>Due {formatDue(activity.dueDate)}</span>
                  </div>
                  {activity.concepts?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activity.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm"
                        >
                          #{concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-space-sm">
                  <button
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-40"
                    disabled={activity.status !== 'DRAFT'}
                    onClick={() => openEdit(activity)}
                    title="Edit draft details"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </button>
                  {activity.status === 'DRAFT' ? (
                    <button
                      className="flex items-center gap-1.5 px-space-md py-2 rounded-[14px] bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-xs disabled:opacity-50"
                      disabled={busyId === activity.id}
                      onClick={() => publish(activity)}
                      type="button"
                    >
                      <span>{busyId === activity.id ? 'Publishing…' : 'Publish Activity'}</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  ) : (
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {activity.status === 'PUBLISHED' ? 'Visible to students' : 'Closed'}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {drawer && (
        <div
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDrawer()
          }}
        >
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-surface-container-lowest shadow-2xl p-space-xl flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-space-lg">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  {drawer.mode === 'create' ? 'Create Activity Draft' : 'Edit Draft Details'}
                </h2>
                <button
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container"
                  onClick={closeDrawer}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {formError && (
                <div className="rounded-xl bg-error-container/60 text-on-error-container px-space-md py-space-sm font-body-sm text-body-sm">
                  {formError.message || 'Could not save the activity.'}
                </div>
              )}

              <label className="flex flex-col gap-1.5 font-label-md text-label-md text-on-surface">
                Title
                <input
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-body-md text-body-md border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Python Loops Diagnostic"
                  type="text"
                  value={form.title}
                />
              </label>
              <label className="flex flex-col gap-1.5 font-label-md text-label-md text-on-surface">
                Description
                <textarea
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-body-md text-body-md border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={2}
                  value={form.description}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <label className="flex flex-col gap-1.5 font-label-md text-label-md text-on-surface">
                  Class
                  <select
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-body-md text-body-md border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                    onChange={(event) => setForm({ ...form, classId: event.target.value })}
                    value={form.classId}
                  >
                    <option value="">Select a class</option>
                    {classes.map((clazz) => (
                      <option key={clazz.id} value={clazz.id}>
                        {clazz.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 font-label-md text-label-md text-on-surface">
                  Due date
                  <input
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-body-md text-body-md border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                    type="datetime-local"
                    value={form.dueDate}
                  />
                </label>
              </div>

              {drawer.mode === 'create' && (
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      Questions
                    </span>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-bold hover:bg-surface-container-high"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          questions: [...current.questions, emptyQuestion()],
                        }))
                      }
                      type="button"
                    >
                      + Add Question
                    </button>
                  </div>
                  {form.questions.map((question, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-space-md rounded-xl bg-surface-container-low"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          Question {index + 1}
                        </span>
                        {form.questions.length > 1 && (
                          <button
                            className="text-error font-label-sm text-label-sm font-bold"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                questions: current.questions.filter((_, position) => position !== index),
                              }))
                            }
                            type="button"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-body-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                        onChange={(event) => updateQuestion(index, { text: event.target.value })}
                        placeholder="Question text"
                        rows={2}
                        value={question.text}
                      />
                      {question.options.map((option) => (
                        <div key={option.key} className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant w-4">
                            {option.key}
                          </span>
                          <input
                            className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-body-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                            onChange={(event) => updateOption(index, option.key, event.target.value)}
                            placeholder={`Option ${option.key}`}
                            type="text"
                            value={option.text}
                          />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
                          Correct answer
                          <select
                            className="bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-body-sm border-0"
                            onChange={(event) =>
                              updateQuestion(index, { correctAnswer: event.target.value })
                            }
                            value={question.correctAnswer}
                          >
                            {OPTION_KEYS.map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
                          Points
                          <input
                            className="bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-body-sm border-0"
                            min="1"
                            onChange={(event) =>
                              updateQuestion(index, { points: event.target.value })
                            }
                            type="number"
                            value={question.points}
                          />
                        </label>
                      </div>
                      <input
                        className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-body-sm text-body-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                        onChange={(event) => updateQuestion(index, { concepts: event.target.value })}
                        placeholder="Concept tags, comma separated"
                        type="text"
                        value={question.concepts}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-space-lg flex items-center justify-end gap-space-sm">
              <button
                className="px-space-md py-2.5 rounded-[14px] bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                onClick={closeDrawer}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-space-lg py-2.5 rounded-[14px] bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-md disabled:opacity-50"
                disabled={saving}
                onClick={submitForm}
                type="button"
              >
                {saving ? 'Saving…' : drawer.mode === 'create' ? 'Save Draft' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <div className="bg-inverse-surface text-inverse-on-surface px-space-md py-3 rounded-xl shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-label-md text-label-md">{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}
