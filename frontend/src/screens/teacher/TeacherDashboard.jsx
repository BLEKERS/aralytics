import { useEffect, useRef, useState } from 'react'
import { api, getStoredClasses, getStoredUser, saveBlob } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, LoadingBlock } from '../../components/DataState'

const FILTER_TAB_ACTIVE =
  'px-3 py-1 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-xs transition-all'
const FILTER_TAB_IDLE =
  'px-3 py-1 rounded-lg text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all'

const MASTERY_PILL_ACTIVE =
  'px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold'
const MASTERY_PILL_IDLE =
  'px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm'

const MASTERY_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'Syntax', label: 'Syntax' },
  { value: 'Logic', label: 'Logic' },
  { value: 'Functions', label: 'Functions' },
]

const ROSTER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'on-track', label: 'On Track' },
  { value: 'needs-nudge', label: 'Needs Nudge' },
  { value: 'needs-help', label: 'Needs Help' },
]

const STATUS_META = {
  'on-track': {
    label: 'On Track (≥70%)',
    modal: 'On Track',
    color: 'text-[#22A06B]',
    dot: 'bg-[#22A06B]',
    bar: 'bg-[#22A06B]',
  },
  'needs-nudge': {
    label: 'Needs Nudge (<75%)',
    modal: 'Needs a Nudge',
    color: 'text-tertiary',
    dot: 'bg-[#F4BF32]',
    bar: 'bg-tertiary-fixed-dim',
  },
  'needs-help': {
    label: 'Needs Help (<70%)',
    modal: 'Needs Help',
    color: 'text-error',
    dot: 'bg-error',
    bar: 'bg-error',
  },
}

function conceptVisual(concept, index) {
  const name = concept?.concept || `Concept ${index + 1}`
  const key = name.toLowerCase()
  const pct = Math.max(0, Math.min(100, Math.round(Number(concept?.masteryLevel) || 0)))

  let emoji = '📘'
  let category = 'Syntax'
  let emojiColor = 'text-primary'
  let barColor = 'bg-primary-container'

  if (/loop|iterat|while|for /.test(key)) {
    emoji = '🔁'
    category = 'Logic'
  } else if (/condition|boolean|branch|if /.test(key)) {
    emoji = '🔀'
    category = 'Logic'
  } else if (/function|scope|return/.test(key)) {
    emoji = '⚙️'
    category = 'Functions'
    emojiColor = 'text-secondary'
  } else if (/syntax|error|debug|variable|data type/.test(key)) {
    emoji = '🐛'
    category = 'Syntax'
    emojiColor = 'text-tertiary'
  }

  if (pct >= 80) {
    barColor = 'bg-[#22A06B]'
  } else if (pct < 70) {
    emojiColor = 'text-tertiary'
    barColor = 'bg-tertiary-fixed-dim'
  }

  return {
    emoji,
    emojiColor,
    name,
    category,
    pct,
    pctColor: pct >= 80 ? 'text-[#22A06B]' : pct >= 70 ? 'text-primary' : 'text-tertiary',
    barColor,
  }
}

function statusForScore(score, threshold) {
  if (score < threshold) return 'needs-help'
  if (score < threshold + 5) return 'needs-nudge'
  return 'on-track'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function mapRosterItem(item, threshold, section) {
  const score = item.averageScore == null ? 0 : Math.round(Number(item.averageScore))
  const statusValue = statusForScore(score, threshold)
  const status = STATUS_META[statusValue]
  const mastery = Array.isArray(item.mastery) ? item.mastery : []
  const latest = mastery
    .map((entry) => entry.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1)
  const focus = mastery
    .slice()
    .sort((a, b) => (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0))
    .slice(0, 2)
    .map((entry) => `${entry.concept} ${Math.round(Number(entry.masteryLevel) || 0)}%`)
    .join(' · ')

  return {
    raw: item,
    id: `STU-${item.studentId}`,
    studentId: item.studentId,
    initials: (item.fullName || '?')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    name: item.fullName || item.username || `Student ${item.studentId}`,
    section: section || '—',
    score,
    scoreColor: status.color,
    barColor: status.bar,
    trend: 'Stable',
    trendColor: 'text-on-surface-variant',
    statusValue,
    statusLabel: status.label,
    statusColor: status.color,
    statusDot: status.dot,
    lastActive: formatDate(latest),
    mailTitle: statusValue === 'on-track' ? 'Send Praise' : 'Send Hint',
    modalStatus: status.modal,
    observation: focus
      ? `Current mastery focus: ${focus}.`
      : 'No diagnostic mastery records have been generated for this student yet.',
  }
}

export default function TeacherDashboard() {
  const [masteryFilter, setMasteryFilter] = useState('All')
  const [rosterFilter, setRosterFilter] = useState('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [modalStudent, setModalStudent] = useState(null)
  const [exporting, setExporting] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Live cohort data. Both endpoints are part of the 40% milestone.
  const dashboard = useApiResource(() => api.teacher.dashboard(), [])
  const [page, setPage] = useState(1)
  const pageSize = 6
  const roster = useApiResource(
    () =>
      api.teacher.students({
        search: studentSearch.trim() || undefined,
        status: rosterFilter === 'all' ? undefined : rosterFilter,
        page,
        size: pageSize,
      }),
    [studentSearch, rosterFilter, page]
  )
  const user = getStoredUser()
  const classLabel = getStoredClasses()[0]?.name || 'Your class'
  const threshold = dashboard.data?.threshold ?? 70

  const rosterStudents = (Array.isArray(roster.data?.items) ? roster.data.items : []).map((item) =>
    mapRosterItem(item, threshold, classLabel)
  )
  // Counts come from the dashboard aggregate so they cover the whole cohort, not one page.
  const statusCounts = {
    all: dashboard.data?.studentCount ?? 0,
    'on-track': dashboard.data?.onTrackCount ?? 0,
    'needs-nudge': dashboard.data?.needsNudgeCount ?? 0,
    'needs-help': dashboard.data?.strugglingCount ?? 0,
  }
  const rosterFilters = ROSTER_FILTERS.map((filter) => ({
    ...filter,
    label: `${filter.label} (${statusCounts[filter.value]})`,
  }))

  const totalStudents = roster.data?.totalItems ?? 0
  const totalPages = Math.max(1, roster.data?.totalPages ?? 1)
  const currentPage = Math.min(page, totalPages)
  const pagedStudents = rosterStudents
  const showingFrom = totalStudents === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalStudents)
  const firstPageInWindow = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const pageNumbers = []
  for (let p = firstPageInWindow; p <= Math.min(totalPages, firstPageInWindow + 4); p += 1) {
    pageNumbers.push(p)
  }

  useEffect(() => {
    setPage(1)
  }, [rosterFilter, studentSearch])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function showToast(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function openStudentModal(student) {
    setModalStudent({
      ...student,
      status: student.status || student.modalStatus || 'On Track',
      score: typeof student.score === 'number' ? `${student.score}%` : student.score,
    })
  }

  function closeStudentModal() {
    setModalStudent(null)
  }

  function sendTeacherNote() {
    const name = modalStudent.name
    closeStudentModal()
    showToast(`Encouragement sent to ${name} & parents portal! 🚀`)
  }

  function sendCodeHint(name) {
    showToast(`Code hint sent to ${name} ✉️`)
  }

  async function runExport(kind) {
    if (exporting) return
    setExporting(kind)
    try {
      const query = { topic: masteryFilter === 'All' ? undefined : masteryFilter }
      const { blob, filename } =
        kind === 'pdf' ? await api.teacher.exportPdf(query) : await api.teacher.exportCsv(query)
      saveBlob(blob, filename || `aralytics-cohort.${kind}`)
      showToast(`Cohort ${kind.toUpperCase()} exported ✅`)
    } catch (error) {
      showToast(error.message || `Could not export the ${kind.toUpperCase()}.`)
    } finally {
      setExporting(null)
    }
  }

  const apiConcepts = (Array.isArray(dashboard.data?.classConceptMastery)
    ? dashboard.data.classConceptMastery
    : []
  ).map(conceptVisual)
  const visibleConcepts = apiConcepts.filter(
    (concept) => masteryFilter === 'All' || concept.category === masteryFilter
  )

  const statusDistribution = [
    { value: 'on-track', color: '#22A06B', label: 'On Track' },
    { value: 'needs-nudge', color: '#F4BF32', label: 'Needs a Nudge' },
    { value: 'needs-help', color: '#BA1A1A', label: 'Needs Help' },
  ]
  const distributionTotal = statusCounts.all
  const distributionCircumference = 2 * Math.PI * 38
  const percentOfCohort = (count) =>
    distributionTotal ? Math.round((count / distributionTotal) * 100) : 0

  let distributionOffset = 0
  const distributionSegments = statusDistribution.map((segment) => {
    const count = statusCounts[segment.value] || 0
    const pct = percentOfCohort(count)
    const dash = (pct / 100) * distributionCircumference
    const circle = {
      ...segment,
      count,
      pct,
      dasharray: `${dash} ${distributionCircumference}`,
      dashoffset: -distributionOffset,
    }
    distributionOffset += dash
    return circle
  })

  const formatMetric = (value, suffix = '%') =>
    value === null || value === undefined ? '—' : `${Number(value).toFixed(1)}${suffix}`
  const studentCount = dashboard.data?.studentCount ?? statusCounts.all
  const belowThresholdCount = dashboard.data?.belowThresholdCount ?? statusCounts['needs-help']
  const firstName = user?.fullName?.split(' ')[0] || 'Teacher'

  return (
    <div className="max-w-[1120px] mx-auto p-margin">
      <div className="flex flex-col w-full">
        {/* Top Greeting & Action Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs mb-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">Welcome back, {firstName}!</span>
              <span className="text-2xl animate-bounce">💻</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Here is your coding cohort analytics for <span className="font-semibold text-on-surface">{classLabel}</span>. <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container/50 text-error font-label-sm text-label-sm font-medium">{belowThresholdCount} students flagged (&lt;{threshold}% threshold)</span></p>
          </div>
          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <div className="relative inline-flex items-center bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-sm text-on-surface cursor-pointer hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-primary text-[18px] mr-1.5">calendar_today</span>
              <span className="font-label-md text-label-md">Unit 4: Loops &amp; Functions (Week 6)</span>
              <span className="material-symbols-outlined text-[18px] ml-1 text-on-surface-variant">expand_more</span>
            </div>
            <button
              className="inline-flex items-center gap-1.5 bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              disabled={Boolean(exporting)}
              onClick={() => runExport('csv')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="font-label-md text-label-md">{exporting === 'csv' ? 'Exporting…' : 'Export Lab CSV'}</span>
            </button>
            <button
              className="inline-flex items-center gap-1.5 bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              disabled={Boolean(exporting)}
              onClick={() => runExport('pdf')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span className="font-label-md text-label-md">{exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}</span>
            </button>
            <button
              className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary px-space-md py-2 rounded-xl shadow-md hover:bg-primary transition-all"
              onClick={() => showToast(`Generating AI code diagnostics for ${classLabel} ✨`)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-label-md text-label-md">Run AI Code Diagnostics</span>
            </button>
          </div>
        </div>
        {(dashboard.loading || roster.loading) && (
          <LoadingBlock className="mb-space-lg" label="Loading cohort analytics from the backend…" />
        )}
        {(dashboard.error || roster.error) && (
          <DataError
            className="mb-space-lg"
            error={dashboard.error || roster.error}
            onRetry={() => {
              dashboard.reload()
              roster.reload()
            }}
          />
        )}
        {/* ROW 1: 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">{/* Stat 1: Cohort Test Pass Rate */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Cohort Test Pass Rate</span>
              <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">terminal</span>
              </div>
            </div>
            <div className="flex items-baseline gap-space-xs mb-space-xs">
              <span className="font-metric-number text-metric-number text-on-surface tracking-tight">{formatMetric(dashboard.data?.classAverage)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-body-sm">
              <span className="inline-flex items-center font-label-sm text-[#22A06B] font-semibold">
                <span className="material-symbols-outlined text-[14px] mr-0.5">groups</span>{studentCount}
              </span>
              <span className="text-on-surface-variant font-body-sm">learners in this cohort</span>
            </div>
          </div>
          {/* Stat 2: Lab Submissions */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Lab Submissions</span>
              <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[16px]">code</span>
              </div>
            </div>
            <div className="flex items-baseline gap-space-xs mb-space-xs">
              <span className="font-metric-number text-metric-number text-on-surface tracking-tight">{formatMetric(dashboard.data?.completionRate)}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">({studentCount} learners)</span>
            </div>
            <div className="flex items-center gap-1.5 text-body-sm">
              <span className="inline-flex items-center font-label-sm text-[#22A06B] font-semibold">
                <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span>Submitted
              </span>
              <span className="text-on-surface-variant font-body-sm truncate">published activity completion</span>
            </div>
          </div>
          {/* Stat 3: Flagged for Intervention */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Flagged for Intervention</span>
              <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[16px]">bug_report</span>
              </div>
            </div>
            <div className="flex items-baseline gap-space-xs mb-space-xs">
              <span className="font-metric-number text-metric-number text-error tracking-tight">{belowThresholdCount}</span>
              <span className="font-body-md text-body-md text-on-surface-variant">students</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">Scored &lt;{threshold}% threshold</span>
              <a className="font-label-sm text-label-sm text-primary font-semibold hover:underline inline-flex items-center gap-0.5" href="#needs-attention-section">
                Review Bugs <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </div>
          {/* Stat 4: Active Coding Time & Streak */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Cohort Learners</span>
              <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[16px]">timer</span>
              </div>
            </div>
            <div className="flex items-baseline gap-space-xs mb-space-xs">
              <span className="font-metric-number text-metric-number text-on-surface tracking-tight">{studentCount}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">enrolled</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
              <span className="truncate max-w-[130px]">{statusCounts['on-track']} on track</span>
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">{statusCounts['needs-help']} flagged</span>
            </div>
          </div>
        </div>
        {/* ROW 2: Class Trajectory & Risk Distribution (8 cols + 4 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
          {/* Left: Score Trajectory (8 cols) — no benchmark series endpoint exists yet */}
          <div className="xl:col-span-8 bg-surface-container-lowest rounded-[20px] p-space-lg shadow-[0_4px_16px_rgba(91,75,219,0.08)] flex flex-col justify-between">
            <div>
              <div className="mb-space-md">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Coding Benchmark Scores Over Time</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Weekly test suite pass rates across the curriculum</p>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-low text-center">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant">show_chart</span>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  No weekly benchmark data is available yet. Scores will appear here once the backend exposes an
                  assessment series.
                </p>
              </div>
            </div>
          </div>
          {/* Right: Class Status Distribution Donut (4 cols) */}
          <div className="xl:col-span-4 bg-surface-container-lowest rounded-[20px] p-space-lg shadow-[0_4px_16px_rgba(91,75,219,0.08)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Status Distribution</h3>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{studentCount} Learners</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Real-time risk triage breakdown</p>
              {/* SVG Donut Chart with Centered Total */}
              <div className="relative flex items-center justify-center my-2">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle ring */}
                  <circle cx="50" cy="50" fill="none" r="38" stroke="#EDECFF" strokeWidth="12" />
                  {/* Live risk segments derived from /api/teacher/students */}
                  {distributionSegments.map((segment) => (
                    <circle
                      key={segment.value}
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke={segment.color}
                      strokeDasharray={segment.dasharray}
                      strokeDashoffset={segment.dashoffset}
                      strokeLinecap="round"
                      strokeWidth="12"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-black leading-none">{studentCount}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Enrolled</span>
                </div>
              </div>
              {/* Distribution Triage Legend (derived from live roster) */}
              <div className="flex flex-col gap-2 mt-space-md">
                {distributionSegments.map((segment) => (
                  <div
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                    key={segment.value}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-label-md text-label-md text-on-surface">
                        {segment.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
                      <span className={segment.value === 'needs-help' ? 'font-semibold text-error' : 'font-semibold'}>
                        {segment.count}
                      </span>
                      <span className="text-on-surface-variant font-normal">({segment.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick AI Diagnostic Highlight */}
            <div className="mt-space-md p-3 rounded-xl bg-primary-fixed/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">lightbulb</span>
              <p className="font-body-sm text-body-sm text-on-surface">
                <span className="font-bold text-primary">AI Code Insight:</span> Off-by-one errors in nested <code className="bg-primary-fixed/50 px-1 py-0.5 rounded text-xs">range(len(...))</code> and variable shadowing were the common root causes for 3 of the 4 flagged students.
              </p>
            </div>
          </div>
        </div>
        {/* ROW 3: Topic Mastery & Needs Attention Grid (6 cols + 6 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg" id="needs-attention-section">
          {/* Left: CS Concept Mastery (6 cols) */}
          <div className="xl:col-span-6 bg-surface-container-lowest rounded-[20px] p-space-lg shadow-[0_4px_16px_rgba(91,75,219,0.08)] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Mastery by CS Concept</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Class pass rate across Python fundamentals</p>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {MASTERY_FILTERS.map((f) => (
                    <button
                      className={masteryFilter === f.value ? MASTERY_PILL_ACTIVE : MASTERY_PILL_IDLE}
                      key={f.value}
                      onClick={() => setMasteryFilter(f.value)}
                      type="button"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* CS Concept Mastery Progress Bars */}
              <div className="flex flex-col gap-space-md mt-space-sm">
                {visibleConcepts.map((topic) => (
                  <div key={topic.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center ${topic.emojiColor} text-[14px]`}>{topic.emoji}</span>
                        <span className="font-label-md text-label-md text-on-surface">{topic.name}</span>
                      </div>
                      <span className={`font-label-md text-label-md ${topic.pctColor} font-bold`}>{topic.pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                      <div className={`h-full ${topic.barColor} rounded-full transition-all duration-500`} style={{ width: `${topic.pct}%` }} />
                    </div>
                  </div>
                ))}
                {visibleConcepts.length === 0 && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    No concept mastery records yet. They appear after students submit their first activity.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-space-lg pt-space-sm flex items-center justify-between bg-surface-container-low p-3 rounded-xl">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Recommended practice assignment:</span>
              <button className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold hover:underline" type="button">
                <span className="material-symbols-outlined text-[16px]">add_circle</span> Assign 15m Loop &amp; Indexing Drill
              </button>
            </div>
          </div>
          {/* Right: Needs Attention (4 Flagged Students) (6 cols) */}
        </div>
        {/* ROW 4: Student Directory & Comprehensive Roster (Full 12 cols) */}
        <div className="bg-surface-container-lowest rounded-[20px] p-space-lg shadow-[0_4px_16px_rgba(91,75,219,0.08)] mb-space-lg">
          {/* Header with Search & Filter Tabs */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mb-space-md pb-space-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Student Directory &amp; Progress</h3>
                <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">{statusCounts.all} learners</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{classLabel} · Continuous Automated Lab Evaluations</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              {/* Search bar inside table header */}
              <div className="relative min-w-[220px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter by student name..."
                  type="text"
                  value={studentSearch}
                />
              </div>
              {/* Filter Pill Tabs */}
              <div className="flex items-center bg-surface-container p-1 rounded-xl">
                {rosterFilters.map((f) => (
                  <button
                    className={rosterFilter === f.value ? FILTER_TAB_ACTIVE : FILTER_TAB_IDLE}
                    key={f.value}
                    onClick={() => setRosterFilter(f.value)}
                    type="button"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                className="inline-flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-xl text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm"
                onClick={() => runExport('csv')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span> Export
              </button>
            </div>
          </div>
          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left font-body-sm text-body-sm">
              <thead>
                <tr className="text-on-surface-variant bg-surface-container-low text-[12px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 rounded-l-xl">Learner Name &amp; ID</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-4">Latest Score</th>
                  <th className="py-3 px-3">Trend</th>
                  <th className="py-3 px-4">Mastery Status</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-on-surface">
                {pagedStudents.map((s) => (
                  <tr className="hover:bg-surface-container-low/50 transition-colors" key={s.id}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-bold text-xs shrink-0">{s.initials}</div>
                        <div>
                          <span className="font-label-md text-label-md text-on-surface font-semibold block">{s.name}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-on-surface-variant">{s.section}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${s.scoreColor} w-8`}>{s.score}%</span>
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className={`h-full ${s.barColor} rounded-full`} style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className={`py-3.5 px-3 ${s.trendColor} font-medium font-label-sm text-label-sm`}>
                      {s.trend}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 font-label-sm text-label-sm ${s.statusColor} font-medium`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.statusDot}`} /> {s.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-on-surface-variant font-label-sm text-label-sm">{s.lastActive}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          onClick={() => sendCodeHint(s.name)}
                          title={s.mailTitle}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">mail</span>
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-lg text-primary hover:bg-surface-container font-label-sm text-label-sm font-semibold transition-colors"
                          onClick={() => openStudentModal(s)}
                          type="button"
                        >
                          Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedStudents.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-on-surface-variant font-body-sm" colSpan={7}>
                      {roster.loading
                        ? 'Loading learners from the backend…'
                        : roster.error
                          ? 'Learner data is unavailable. Check that the backend is running, then retry.'
                          : statusCounts.all === 0
                            ? 'No learners are enrolled in this cohort yet.'
                            : 'No learners match this filter or search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-md mt-space-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {totalStudents === 0
                ? 'Showing 0 students'
                : `Showing ${showingFrom} to ${showingTo} of ${totalStudents} students`}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  className={
                    pageNumber === currentPage
                      ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-bold'
                      : 'w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm'
                  }
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* INTERACTIVE MODAL / DETAIL PREVIEW: Student Diagnostic Drilldown */}
      {modalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-surface-container-lowest rounded-[24px] max-w-lg w-full p-space-lg shadow-[0_20px_40px_rgba(31,35,64,0.16)] flex flex-col gap-space-md relative transform transition-transform duration-200 scale-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-space-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-base shadow-sm">
                  {modalStudent.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{modalStudent.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${modalStudent.status.includes('Help') ? 'bg-[#FDE4E5] text-[#E5484D]' : modalStudent.status.includes('Nudge') ? 'bg-[#FFEFD1] text-[#B8740B]' : 'bg-[#DDF5E8] text-[#22A06B]'}`}>{modalStudent.status}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">CS 101: Intro to Python · Student ID: {modalStudent.id}</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface" onClick={closeStudentModal} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* AI Feedback Summary */}
            <div className="p-space-md rounded-xl bg-primary-fixed/25 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span className="font-label-md text-label-md font-bold">Aralytics AI Diagnostic</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                {`"${modalStudent.observation}"`}
              </p>
            </div>
            {/* Performance Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-surface-container rounded-xl">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Recent Score</span>
                <span className={`font-headline-sm text-headline-sm ${modalStudent.status.includes('Help') ? 'text-error' : modalStudent.status.includes('Nudge') ? 'text-tertiary' : 'text-[#22A06B]'} font-bold`}>{modalStudent.score}</span>
              </div>
              <div className="p-2.5 bg-surface-container rounded-xl">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Avg Duration</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">—</span>
              </div>
              <div className="p-2.5 bg-surface-container rounded-xl">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Attendance</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">—</span>
              </div>
            </div>
            {/* Quick Action / Encouragement Message Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold" htmlFor="teacherQuickNote">Send Code Hint / Feedback to Student Lab Console:</label>
              <textarea
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm p-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-container"
                id="teacherQuickNote"
                placeholder="e.g. Remember that range(start, stop) stops before reaching 'stop'! Try printing your loop variable inside each iteration..."
                rows={2}
              />
            </div>
            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-space-xs pt-space-xs">
              <button className="px-space-md py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md font-semibold transition-colors" onClick={closeStudentModal} type="button">
                Cancel
              </button>
              <button className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-sm" onClick={sendTeacherNote} type="button">
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span className="">Send Encouragement</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notification Toast (for quick interactions) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-inverse-surface text-inverse-on-surface px-space-md py-3 rounded-xl shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[#71F8E4] text-[20px]">check_circle</span>
            <span className="font-label-md text-label-md">{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}
