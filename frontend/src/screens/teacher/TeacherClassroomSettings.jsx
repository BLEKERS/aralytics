import { useEffect, useState } from 'react'
import { api, getStoredClasses, getStoredUser } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, LoadingBlock } from '../../components/DataState'

const TONES = [
  { value: 'FORMAL', title: 'Formal', desc: 'Measured, academic English with complete sentences.' },
  { value: 'CONVERSATIONAL', title: 'Conversational', desc: 'Warm, friendly phrasing that reads like a coach.' },
  { value: 'SOCRATIC', title: 'Encouraging & Socratic', desc: 'Asks guiding tracing questions instead of revealing answers.' },
  { value: 'CONCISE', title: 'Direct & Technical', desc: 'Short runtime and PEP 8 notes with no filler.' },
  { value: 'CHALLENGING', title: 'Challenging', desc: 'Pushes edge cases, complexity limits, and unit tests.' },
]

export default function TeacherClassroomSettings() {
  const settings = useApiResource(() => api.teacher.settings(), [])
  const [threshold, setThreshold] = useState(70)
  const [tone, setTone] = useState('FORMAL')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const user = getStoredUser()
  const classes = getStoredClasses()

  useEffect(() => {
    if (!settings.data) return
    setThreshold(settings.data.interventionThreshold)
    setTone(settings.data.feedbackTone)
  }, [settings.data])

  async function save() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      await api.teacher.updateSettings({
        interventionThreshold: Number(threshold),
        feedbackTone: tone,
      })
      setSaved(true)
      settings.reload()
    } catch (error) {
      setSaveError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-space-md lg:px-space-xl py-space-lg flex flex-col gap-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              Computer Science Department · Diagnostic Configuration
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Platform &amp; Classroom Settings
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              These preferences are saved to your teacher account and apply to your dashboard, roster,
              and AI feedback.
            </p>
          </div>
          <button
            className="flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary px-space-lg py-2.5 rounded-xl font-label-lg text-label-lg shadow-[0_4px_16px_rgba(91,75,219,0.24)] transition-all disabled:opacity-50 shrink-0"
            disabled={saving || settings.loading}
            onClick={save}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{saving ? 'Saving…' : 'Save Settings'}</span>
          </button>
        </div>

        {saved && (
          <div className="rounded-xl bg-secondary-container text-on-secondary-container px-space-md py-space-sm font-label-md text-label-md font-semibold">
            Settings saved.
          </div>
        )}
        {saveError && <DataError error={saveError} onRetry={save} />}
        {settings.loading && <LoadingBlock label="Loading your settings…" />}
        {settings.error && <DataError error={settings.error} onRetry={settings.reload} />}

        {!settings.loading && !settings.error && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <section className="xl:col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_rgba(91,75,219,0.08)] flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">terminal</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    AI Diagnostic Feedback Tone
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Controls how the diagnostic agent explains root causes.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-space-xs">
                {TONES.map((option) => {
                  const selected = tone === option.value
                  return (
                    <button
                      key={option.value}
                      className={
                        'text-left p-space-md rounded-xl transition-all flex items-start justify-between gap-space-sm ' +
                        (selected ? 'bg-surface-container-high shadow-md' : 'bg-surface-container-low hover:bg-surface-container-high')
                      }
                      onClick={() => setTone(option.value)}
                      type="button"
                    >
                      <div className="flex items-start gap-space-sm">
                        <span
                          className={
                            'material-symbols-outlined text-[22px] shrink-0 mt-0.5 ' +
                            (selected ? 'text-primary' : 'text-outline')
                          }
                        >
                          {selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg text-on-surface font-bold">
                            {option.title}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {option.desc}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="xl:col-span-5 flex flex-col gap-space-lg">
              <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_rgba(91,75,219,0.08)] flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Profile &amp; Cohorts</h2>
                </div>
                <div className="flex flex-col p-space-md rounded-xl bg-surface-container-low gap-1">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    {user?.fullName || 'Teacher'}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {user?.email || ''}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    {user?.schoolName || 'Aralytics'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Active Coding Cohorts
                  </span>
                  {classes.length === 0 && (
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      No cohorts assigned yet.
                    </span>
                  )}
                  {classes.map((clazz) => (
                    <div
                      key={clazz.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low"
                    >
                      <span className="font-label-md text-label-md text-on-surface">{clazz.name}</span>
                      <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
                        #{clazz.id}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_rgba(91,75,219,0.08)] flex flex-col gap-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Remedial Intervention Threshold
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Students below this score are flagged on your dashboard and roster.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Threshold</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold bg-surface-container-lowest px-3 py-1 rounded-lg shadow-xs">
                    {threshold}%
                  </span>
                </div>
                <input
                  className="w-full accent-primary cursor-pointer"
                  max="100"
                  min="0"
                  onChange={(event) => setThreshold(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={threshold}
                />
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>0% (Permissive)</span>
                  <span>100% (Strict)</span>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
