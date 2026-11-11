import { useState } from 'react'
import { api, getStoredClasses, saveBlob } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(1)}%`
}

export default function ClassReportsLearningAnalytics() {
  const classes = getStoredClasses()
  const [classId, setClassId] = useState(classes[0] ? String(classes[0].id) : '')
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState(null)

  const dashboard = useApiResource(
    () => api.teacher.dashboard({ section: classId || undefined }),
    [classId]
  )
  const data = dashboard.data
  const className = classes.find((item) => String(item.id) === classId)?.name || 'All classes'

  async function runExport(kind) {
    if (exporting) return
    setExporting(kind)
    setExportError(null)
    try {
      const { blob, filename } =
        kind === 'pdf'
          ? await api.teacher.exportPdf({ section: classId || undefined })
          : await api.teacher.exportCsv()
      saveBlob(blob, filename || (kind === 'pdf' ? 'aralytics-cohort.pdf' : 'aralytics-roster.csv'))
    } catch (error) {
      setExportError(error)
    } finally {
      setExporting(null)
    }
  }

  const metrics = [
    {
      label: 'Class Average',
      value: formatPercent(data?.classAverage),
      note: `Intervention threshold ${data?.threshold ?? 70}%`,
      icon: 'school',
    },
    {
      label: 'Completion Rate',
      value: formatPercent(data?.completionRate),
      note: 'Published activity completion',
      icon: 'task_alt',
    },
    {
      label: 'Flagged for Intervention',
      value: data ? String(data.belowThresholdCount ?? 0) : '—',
      note: `Scored below ${data?.threshold ?? 70}%`,
      icon: 'bug_report',
    },
    {
      label: 'Active Learners',
      value: data ? `${data.activeStudentCount ?? 0} / ${data.studentCount ?? 0}` : '—',
      note: 'Submitted at least one activity',
      icon: 'groups',
    },
  ]

  const concepts = Array.isArray(data?.classConceptMastery) ? data.classConceptMastery : []
  const atRisk = Array.isArray(data?.belowThreshold) ? data.belowThreshold : []

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full max-w-[1120px] mx-auto px-space-lg py-space-xl">
        <div className="flex flex-col gap-space-lg mb-space-xl">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
            <div className="max-w-2xl">
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                Cohort Reports &amp; Learning Analytics
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
                Live mastery and intervention data for{' '}
                <span className="font-semibold text-primary">{className}</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <button
                className="flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-label-lg text-label-lg shadow-sm transition-all disabled:opacity-60"
                type="button"
                onClick={() => runExport('csv')}
                disabled={Boolean(exporting)}
              >
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {exporting === 'csv' ? 'progress_activity' : 'table_chart'}
                </span>
                <span>{exporting === 'csv' ? 'Exporting…' : 'Export Roster CSV'}</span>
              </button>
              <button
                className="flex items-center gap-space-xs bg-primary-container text-on-primary hover:bg-primary px-4 py-2.5 rounded-xl font-label-lg text-label-lg shadow-sm transition-all disabled:opacity-60"
                type="button"
                onClick={() => runExport('pdf')}
                disabled={Boolean(exporting)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {exporting === 'pdf' ? 'progress_activity' : 'file_download'}
                </span>
                <span>{exporting === 'pdf' ? 'Exporting…' : 'Download PDF Summary'}</span>
              </button>
            </div>
          </div>
          {classes.length > 0 && (
            <div className="bg-surface-container-lowest p-space-sm rounded-2xl shadow-sm flex flex-wrap items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[18px] ml-1">group</span>
              <select
                aria-label="Class Selector"
                className="bg-surface-container-low text-on-surface font-label-md text-label-md px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
              >
                {classes.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {dashboard.loading && <LoadingBlock className="mb-space-lg" label="Loading cohort reports…" />}
        {dashboard.error && (
          <DataError className="mb-space-lg" error={dashboard.error} onRetry={dashboard.reload} />
        )}
        {exportError && <DataError className="mb-space-lg" error={exportError} />}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
          {metrics.map((metric) => (
            <div
              className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              key={metric.label}
            >
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">{metric.label}</span>
                <span className="p-2 rounded-xl bg-primary-container/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">{metric.icon}</span>
                </span>
              </div>
              <div className="mt-space-md">
                <span className="font-metric-number text-metric-number text-on-surface tracking-tight">
                  {metric.value}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{metric.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm mb-space-xl">
          <div className="mb-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface">Concept Mastery</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Average class mastery across published activities.
            </p>
          </div>
          {concepts.length === 0 ? (
            <EmptyBlock
              icon="insights"
              title="No mastery data yet"
              message="Concept mastery appears once students submit their first published activity."
            />
          ) : (
            <div className="flex flex-col gap-space-md">
              {concepts.map((concept) => {
                const pct = Math.max(0, Math.min(100, Math.round(Number(concept.masteryLevel) || 0)))
                return (
                  <div key={concept.concept}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-md text-label-md text-on-surface">{concept.concept}</span>
                      <span className="font-label-md text-label-md text-on-surface font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 85 ? 'bg-[#22A06B]' : pct >= 70 ? 'bg-primary-container' : 'bg-tertiary-fixed-dim'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
          <div className="mb-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface">Needs Attention</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Students averaging below the {(data?.threshold ?? 70)}% intervention threshold.
            </p>
          </div>
          {atRisk.length === 0 ? (
            <EmptyBlock
              icon="verified"
              title="No students below the threshold"
              message="Every graded student is at or above the intervention threshold."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[560px] text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="text-on-surface-variant bg-surface-container-low text-[12px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 rounded-l-xl">Student</th>
                    <th className="py-3 px-3">Average</th>
                    <th className="py-3 px-3">Completed</th>
                    <th className="py-3 px-4 rounded-r-xl">Weakest Concepts</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {atRisk.map((student) => {
                    const weakest = (student.mastery || [])
                      .slice()
                      .sort((a, b) => (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0))
                      .slice(0, 2)
                      .map((entry) => `${entry.concept} ${Math.round(Number(entry.masteryLevel) || 0)}%`)
                      .join(' · ')
                    return (
                      <tr className="hover:bg-surface-container-low/50 transition-colors" key={student.studentId}>
                        <td className="py-3.5 px-4 font-semibold">{student.fullName}</td>
                        <td className="py-3.5 px-3 text-error font-semibold">
                          {formatPercent(student.averageScore)}
                        </td>
                        <td className="py-3.5 px-3 text-on-surface-variant">{student.completedCount}</td>
                        <td className="py-3.5 px-4 text-on-surface-variant">{weakest || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
