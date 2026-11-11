import { useEffect, useRef, useState } from 'react'
import { api, getStoredClasses, saveBlob } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

const pillActive = 'px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-bold shadow-xs whitespace-nowrap'
const pillIdle = 'px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap flex items-center gap-1'
const rowActionBtn = 'p-1.5 rounded-lg hover:bg-surface-container transition-colors'
const iconFill = { fontVariationSettings: "'FILL' 1" }

const ROSTER_PAGE_SIZE = 7
const DEFAULT_THRESHOLD = 70

const STATUS_META = {
  high: {
    label: 'High Mastery',
    pill: 'bg-secondary-container text-on-secondary-container',
    text: 'text-secondary',
    dot: 'bg-secondary',
    icon: '✅',
  },
  practice: {
    label: 'Needs Practice',
    pill: 'bg-tertiary-fixed text-on-tertiary-fixed',
    text: 'text-tertiary',
    dot: 'bg-tertiary-fixed-dim',
    icon: '⚠️',
  },
  struggling: {
    label: 'Needs Help',
    pill: 'bg-error-container text-on-error-container',
    text: 'text-error',
    dot: 'bg-error',
    icon: '⚠️',
  },
}

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function initialsFor(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function abbreviateConcept(name) {
  const words = (name || '?').split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function formatWhen(value) {
  if (!value) return 'No activity yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No activity yet'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function masteryBarClass(pct) {
  if (pct >= 85) return 'bg-secondary'
  if (pct >= 70) return 'bg-tertiary-fixed-dim'
  return 'bg-error'
}

function masteryTextClass(pct) {
  if (pct >= 85) return 'text-secondary font-bold'
  if (pct >= 70) return 'text-tertiary font-bold'
  return 'text-error font-bold'
}

function normalizeStudent(item, threshold) {
  const score = clampPercent(item.averageScore)
  const mastery = (Array.isArray(item.mastery) ? item.mastery : [])
    .map((entry) => ({
      ...entry,
      pct: clampPercent(entry.masteryLevel),
    }))
    .sort((a, b) => b.pct - a.pct)
  const status = item.belowThreshold ? 'struggling' : score >= 85 ? 'high' : score < threshold ? 'struggling' : 'practice'
  const latestMastery = mastery
    .map((entry) => entry.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1)
  const weakest = mastery.slice().sort((a, b) => a.pct - b.pct).slice(0, 2)

  return {
    ...item,
    score,
    mastery,
    weakest,
    status,
    statusMeta: STATUS_META[status],
    initials: initialsFor(item.fullName),
    lastActive: formatWhen(latestMastery),
  }
}

export default function StudentsMasteryRoster() {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [page, setPage] = useState(1)
  const [note, setNote] = useState('')
  const [savedLabel, setSavedLabel] = useState('Not synced in this version')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const roster = useApiResource(
    () =>
      api.teacher.students({
        search: query.trim() || undefined,
        topic: subject === 'all' ? undefined : subject,
        status: activeFilter === 'all' ? undefined : activeFilter,
        page,
        size: ROSTER_PAGE_SIZE,
      }),
    [query, subject, activeFilter, page]
  )
  const dashboard = useApiResource(() => api.teacher.dashboard(), [])
  const threshold = dashboard.data?.threshold ?? DEFAULT_THRESHOLD
  const classLabel = getStoredClasses()[0]?.name || 'CS 101: Intro to Python (Section A)'

  const students = (Array.isArray(roster.data?.items) ? roster.data.items : []).map((item) =>
    normalizeStudent(item, threshold)
  )

  const conceptOptions = Array.from(
    new Set(
      (Array.isArray(dashboard.data?.classConceptMastery)
        ? dashboard.data.classConceptMastery
        : []
      ).map((entry) => entry.concept)
    )
  ).sort()

  // Cohort-wide counts from the dashboard aggregate; the roster itself is paginated.
  const counts = {
    all: dashboard.data?.studentCount ?? 0,
    high: dashboard.data?.highMasteryCount ?? 0,
    practice: dashboard.data?.practiceCount ?? 0,
    struggling: dashboard.data?.strugglingCount ?? 0,
  }

  const totalStudents = roster.data?.totalItems ?? 0
  const totalPages = Math.max(1, roster.data?.totalPages ?? 1)
  const currentPage = Math.min(page, totalPages)
  const pagedStudents = students
  const showingFrom = totalStudents === 0 ? 0 : (currentPage - 1) * ROSTER_PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * ROSTER_PAGE_SIZE, totalStudents)
  const pageNumbers = []
  const firstPageInWindow = Math.max(1, Math.min(currentPage - 1, totalPages - 2))
  for (let index = firstPageInWindow; index <= Math.min(totalPages, firstPageInWindow + 2); index += 1) {
    pageNumbers.push(index)
  }

  useEffect(() => {
    setPage(1)
  }, [query, subject, activeFilter])

  useEffect(() => {
    if (selectedId === null && students.length > 0) {
      setSelectedId(students[0].studentId)
    }
  }, [selectedId, students])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const selectedStudent =
    students.find((student) => student.studentId === selectedId) || students[0] || null

  const detail = useApiResource(
    () => (selectedStudent ? api.teacher.student(selectedStudent.studentId) : Promise.resolve(null)),
    [selectedStudent?.studentId]
  )

  const detailMastery = (Array.isArray(detail.data?.mastery) ? detail.data.mastery : [])
    .map((entry) => ({ ...entry, pct: clampPercent(entry.masteryLevel) }))
    .sort((a, b) => b.pct - a.pct)
  const panelMastery = detailMastery.length ? detailMastery : selectedStudent?.mastery || []
  const latestFeedback = Array.isArray(detail.data?.feedback) ? detail.data.feedback[0] : null
  const weakestConcepts = panelMastery
    .slice()
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
  const aiSummary =
    latestFeedback?.content?.trim() ||
    (weakestConcepts.length
      ? `Focus areas: ${weakestConcepts
          .map((entry) => `${entry.concept} (${entry.pct}%)`)
          .join(', ')}. ${selectedStudent?.completedCount ?? 0} published ${
          (selectedStudent?.completedCount ?? 0) === 1 ? 'activity' : 'activities'
        } completed so far.`
      : 'No diagnostic feedback has been generated for this student yet. Publish a quiz and submit an attempt to populate mastery insights.')
  const recommendedIntervention = weakestConcepts.length
    ? `Assign a targeted ${weakestConcepts[0].concept} drill (${Math.max(
        1,
        Math.round((100 - weakestConcepts[0].pct) / 20)
      )} questions)`
    : 'Assign a diagnostic quiz to collect mastery data'

  const activeLearners = dashboard.data?.activeStudentCount ?? 0
  const activePercent = counts.all ? Math.round((activeLearners / counts.all) * 100) : 0

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  async function handleExportCsv() {
    if (students.length === 0) {
      notify('There are no learner rows to export yet.')
      return
    }
    try {
      const { blob, filename } = await api.teacher.exportCsv({
        topic: subject === 'all' ? undefined : subject,
      })
      saveBlob(blob, filename || 'aralytics-student-masterlist.csv')
      notify(`Exported ${totalStudents} learner rows from the backend.`)
    } catch (error) {
      notify(error.message || 'Could not export the masterlist.')
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-lg py-space-xl max-w-[1280px] w-full mx-auto flex flex-col gap-space-xl">
        {/* Top Context & Header Action Band */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
              <span className="text-primary font-bold">Classroom Central</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="">Learner Performance Diagnostics</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Students &amp; Coding Mastery Roster</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {counts.all} enrolled {counts.all === 1 ? 'student' : 'students'} in <span className="text-primary font-semibold">{classLabel}</span> · Spring Cohort Assessment Period
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-all shadow-sm font-label-md text-label-md" onClick={handleExportCsv} title="Download spreadsheet of student records" type="button">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              <span className="">Export Masterlist (CSV)</span>
            </button>
            <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high transition-all font-label-md text-label-md" onClick={() => notify('Batch nudge is not available in this version.')} title="Broadcast nudge to filtered group" type="button">
              <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
              <span className="">Batch Nudge / Message</span>
            </button>
            <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md font-label-md text-label-md" onClick={() => notify('Student enrollment is not available in this version.')} title="Enroll new learner" type="button">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span className="">+ Add Student</span>
            </button>
          </div>
        </div>

        {(roster.loading || dashboard.loading) && (
          <LoadingBlock label="Loading roster and diagnostics from the backend…" />
        )}
        {(roster.error || dashboard.error) && (
          <DataError
            error={roster.error || dashboard.error}
            onRetry={() => {
              roster.reload()
              dashboard.reload()
            }}
          />
        )}

        {/* Overview Diagnostic KPI Ribbon (3 Cards with Visual Mastery Rings) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
          {/* High Performance / On Track */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-space-xs z-10">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">High Mastery</span>
              </div>
              <div className="flex items-baseline gap-space-xs mt-1">
                <span className="font-metric-number text-metric-number text-on-surface">{counts.high}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">students</span>
              </div>
              <div className="flex items-center gap-1 font-body-sm text-body-sm text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="">{counts.all ? Math.round((counts.high / counts.all) * 100) : 0}% of class · ≥85% mastery</span>
              </div>
            </div>
            {/* Progress Ring Visual */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${counts.all ? Math.round((counts.high / counts.all) * 100) : 0}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <span className="absolute font-headline-sm text-headline-sm text-on-surface">{counts.all ? Math.round((counts.high / counts.all) * 100) : 0}%</span>
            </div>
          </div>
          {/* Needs a Nudge */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-space-xs z-10">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Needs Practice</span>
              </div>
              <div className="flex items-baseline gap-space-xs mt-1">
                <span className="font-metric-number text-metric-number text-on-surface">{counts.practice}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">students</span>
              </div>
              <div className="flex items-center gap-1 font-body-sm text-body-sm text-tertiary font-medium">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span className="">{counts.all ? Math.round((counts.practice / counts.all) * 100) : 0}% of class · Approaching the {threshold}% threshold</span>
              </div>
            </div>
            {/* Progress Ring Visual */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                <path className="text-tertiary-fixed-dim" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${counts.all ? Math.round((counts.practice / counts.all) * 100) : 0}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <span className="absolute font-headline-sm text-headline-sm text-on-surface">{counts.all ? Math.round((counts.practice / counts.all) * 100) : 0}%</span>
            </div>
          </div>
          {/* Needs Immediate Intervention */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-space-xs z-10">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="font-label-md text-label-md text-error uppercase tracking-wider font-bold">Needs Intervention</span>
              </div>
              <div className="flex items-baseline gap-space-xs mt-1">
                <span className="font-metric-number text-metric-number text-error">{counts.struggling}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">students</span>
              </div>
              <div className="flex items-center gap-1 font-body-sm text-body-sm text-error font-medium">
                <span className="material-symbols-outlined text-[16px]">priority_high</span>
                <span className="">{counts.all ? Math.round((counts.struggling / counts.all) * 100) : 0}% of class · Below {threshold}% threshold</span>
              </div>
            </div>
            {/* Progress Ring Visual */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                <path className="text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${counts.all ? Math.round((counts.struggling / counts.all) * 100) : 0}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <span className="absolute font-headline-sm text-headline-sm text-error">{counts.all ? Math.round((counts.struggling / counts.all) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Main Workspace: Left Matrix (70%) + Right Focus Drawer (30%) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Student Roster & Matrix Table Area (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-space-md">
            {/* Filter and Search Bar Control Tray */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col md:flex-row gap-space-sm items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                  <input className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-10 pr-4 py-2.5 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Filter by student name, email, or topic..." type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                {/* Subject selector dropdown */}
                <div className="w-full md:w-auto flex items-center gap-space-xs self-stretch md:self-auto">
                  <label className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap" htmlFor="subjectSelect">Topic Focus:</label>
                  <select className="bg-surface-container-low text-on-surface font-label-md text-label-md px-3 py-2 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-container w-full md:w-auto cursor-pointer" id="subjectSelect" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="all">All Coding Units (Holistic)</option>
                    {conceptOptions.map((concept) => (
                      <option key={concept} value={concept}>{concept}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Filter Pills Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-label-sm font-label-sm">
                <button className={activeFilter === 'all' ? pillActive : pillIdle} onClick={() => setActiveFilter('all')} type="button">All ({counts.all})</button>
                <button className={activeFilter === 'high' ? pillActive : pillIdle} onClick={() => setActiveFilter('high')} type="button">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  High Mastery ({counts.high})
                </button>
                <button className={activeFilter === 'practice' ? pillActive : pillIdle} onClick={() => setActiveFilter('practice')} type="button">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  Needs Practice ({counts.practice})
                </button>
                <button className={activeFilter === 'struggling' ? pillActive : pillIdle} onClick={() => setActiveFilter('struggling')} type="button">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  Struggling ({counts.struggling})
                </button>
              </div>
            </div>

            {/* Roster Matrix Table Card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-3 px-4">Student &amp; ID</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Overall</th>
                      <th className="py-3 px-3 min-w-[140px]">Coding Topic Mastery</th>
                      <th className="py-3 px-3">AI Diagnostic Intervention</th>
                      <th className="py-3 px-3 text-center">Signal</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
                    {pagedStudents.map((student) => {
                      const isSelected = selectedStudent?.studentId === student.studentId
                      const meta = student.statusMeta
                      const topTopics = student.mastery.slice(0, 4)
                      return (
                        <tr
                          className={`${isSelected ? 'bg-surface-container-high/40 border-l-4 border-l-primary-container ' : ''}hover:bg-surface-container-high transition-colors cursor-pointer`}
                          key={student.studentId}
                          onClick={() => setSelectedId(student.studentId)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-9 h-9 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-bold text-xs ${isSelected ? 'ring-2 ring-primary-container' : ''}`}>
                                  {student.initials}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${meta.dot} ring-2 ring-surface-container-lowest`} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`font-label-lg text-label-lg truncate ${isSelected ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>{student.fullName}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">ID: STU-{student.studentId} · {student.lastActive}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${meta.pill}`}>{meta.label}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`font-headline-sm text-headline-sm font-extrabold ${meta.text}`}>{student.score}%</span>
                          </td>
                          <td className="py-3.5 px-3">
                            {topTopics.length ? (
                              <div className="flex flex-col gap-1 w-32">
                                <div className="flex items-center justify-between text-[10px] text-on-surface-variant gap-1">
                                  {topTopics.map((topic) => (
                                    <span key={topic.conceptId ?? topic.concept} title={`${topic.concept}: ${topic.pct}%`}>
                                      {abbreviateConcept(topic.concept)}: {topic.pct}%
                                    </span>
                                  ))}
                                </div>
                                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex">
                                  {topTopics.map((topic) => (
                                    <div
                                      className={`${masteryBarClass(topic.pct)} h-full`}
                                      key={topic.conceptId ?? topic.concept}
                                      style={{ width: `${100 / topTopics.length}%` }}
                                      title={`${topic.concept}: ${topic.pct}%`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-on-surface-variant">No mastery data</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 max-w-[210px]">
                            <div className="flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5" style={iconFill}>auto_awesome</span>
                              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                                {student.weakest.length ? (
                                  <>
                                    Focus on <span className="font-semibold text-on-surface">{student.weakest[0].concept}</span> ({student.weakest[0].pct}%). {student.completedCount} completed.
                                  </>
                                ) : (
                                  'No diagnostic mastery records yet. Publish an activity to collect evidence.'
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center text-lg" title={meta.label}>
                            {meta.icon}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button className={`${rowActionBtn} text-primary`} onClick={(event) => { event.stopPropagation(); notify('Remedial assignment is not available in this version.') }} title="Assign Remedial Practice" type="button">
                                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                              </button>
                              <button className={`${rowActionBtn} text-on-surface-variant`} onClick={(event) => { event.stopPropagation(); notify('Direct messaging is not available in this version.') }} title="Send Coding Hint" type="button">
                                <span className="material-symbols-outlined text-[18px]">send</span>
                              </button>
                              <button className={`${rowActionBtn} text-on-surface-variant`} onClick={(event) => { event.stopPropagation(); setSelectedId(student.studentId) }} title="View student details" type="button">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {pagedStudents.length === 0 && (
                      <tr>
                        <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={7}>
                          {roster.loading
                            ? 'Loading learners from the backend…'
                            : roster.error
                              ? 'Learner data is unavailable. Check that the backend is running, then retry.'
                              : counts.all === 0
                                ? 'No learners are enrolled in this cohort yet.'
                                : 'No learners match this filter or search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination / Masterlist Summary Bar */}
              <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="">Showing <strong className="text-on-surface">{totalStudents ? `${showingFrom} - ${showingTo}` : '0'}</strong> of {totalStudents} students</span>
                  <span className="text-outline-variant">·</span>
                  <span className="text-xs">{counts.struggling} learners below the {threshold}% intervention threshold</span>
                </div>
                <div className="flex items-center gap-1 font-label-md text-label-md">
                  <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant disabled:opacity-50" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Previous</button>
                  {pageNumbers.map((pageNumber) => (
                    <button key={pageNumber} className={pageNumber === currentPage ? 'px-3 py-1 rounded-lg bg-primary-container text-on-primary font-bold' : 'px-3 py-1 rounded-lg hover:bg-surface-container text-on-surface'} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button>
                  ))}
                  <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">Next</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Focus Drawer / Student Deep-Dive Panel (xl:col-span-4) */}
          <div className="xl:col-span-4 flex flex-col gap-space-md">
            {selectedStudent ? (
              <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md relative overflow-hidden">
                {/* Card Header & Status */}
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-lg ring-2 ring-primary-container shadow-sm">
                      {selectedStudent.initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{selectedStudent.fullName}</h3>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{selectedStudent.completedCount} completed · {selectedStudent.email}</span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">ID: STU-{selectedStudent.studentId}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${selectedStudent.statusMeta.pill} font-bold`}>{selectedStudent.statusMeta.label}</span>
                </div>

                {detail.loading && <LoadingBlock label="Loading student diagnostic…" />}
                {detail.error && <DataError error={detail.error} onRetry={detail.reload} />}

                {/* Mastery Breakdown Mini Grid */}
                {panelMastery.length ? (
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-space-sm rounded-xl">
                    {panelMastery.slice(0, 4).map((topic) => (
                      <div key={topic.conceptId ?? topic.concept} className="flex flex-col p-2 bg-surface-container-lowest rounded-lg">
                        <span className="font-label-sm text-label-sm text-on-surface-variant truncate" title={topic.concept}>{topic.concept}</span>
                        <span className={`font-headline-sm text-headline-sm ${masteryTextClass(topic.pct)}`}>{topic.pct}%</span>
                        <span className="text-[10px] text-on-surface-variant">Updated {formatWhen(topic.lastUpdated)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock icon="insights" title="No mastery data yet" message="Mastery appears here after the student submits a published activity." />
                )}

                {/* AI Feedback Snippet Box */}
                <div className="bg-primary-fixed/30 rounded-xl p-space-md flex flex-col gap-space-xs relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-bold">
                      <span className="material-symbols-outlined text-[16px]" style={iconFill}>psychology</span>
                      <span className="">Aralytics Diagnostic Summary</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {latestFeedback?.generatedAt ? formatWhen(latestFeedback.generatedAt) : 'Live from mastery data'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed italic bg-surface-container-lowest/80 p-2.5 rounded-lg">
                    {aiSummary}
                  </p>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="font-label-sm text-label-sm text-primary font-semibold">Recommended Intervention:</span>
                    <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-2.5 py-1 rounded-lg font-bold">{recommendedIntervention}</span>
                  </div>
                </div>

                {/* Direct Teacher Action Callout */}
                <div className="flex flex-col gap-2">
                  <button className="w-full flex items-center justify-center gap-space-xs py-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-lg text-label-lg hover:bg-tertiary-fixed-dim transition-colors shadow-sm" onClick={() => notify('Remedial quiz assignment is not available in this version.')} type="button">
                    <span className="material-symbols-outlined text-[18px]">code</span>
                    <span className="">Assign Remedial Coding Quiz</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-1 py-2 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => notify('Student chat is not available in this version.')} type="button">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                      <span className="">Student Chat</span>
                    </button>
                    <button className="flex items-center justify-center gap-1 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => notify('The coding sandbox is not available in this version.')} type="button">
                      <span className="material-symbols-outlined text-[16px]">terminal</span>
                      <span className="">Open Sandbox</span>
                    </button>
                  </div>
                </div>

                {/* Teacher Private Observation Notes */}
                <div className="flex flex-col gap-space-xs pt-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit_note</span>
                      Teacher Log (Private)
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-label-sm">Local only</span>
                  </div>
                  <textarea className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm p-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-container transition-all resize-none" placeholder="Confidential observations on code trace capability, debug sessions..." rows={3} value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">sync_problem</span>
                      {savedLabel}
                    </span>
                    <button className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm hover:bg-primary transition-colors shadow-xs" onClick={() => { setSavedLabel('Saved locally — not synced'); notify('Private notes are not persisted by the 40% backend.') }} type="button">
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyBlock icon="person_search" title="Select a learner" message="Choose a row in the roster to open the diagnostic deep-dive." />
            )}

            {/* Weekly Intervention Tracker Widget */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-label-lg text-label-lg text-on-surface font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">checklist</span>
                  Remediation Activity (Current Cycle)
                </h4>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{activeLearners} / {counts.all} Active</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${activePercent}%` }}></div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {activePercent}% of enrolled learners have completed at least one published activity this cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Confirmation */}
      <div
        className={
          'fixed bottom-6 right-6 z-50 transform transition-all duration-300 flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-lg py-3 rounded-xl shadow-xl max-w-md ' +
          (toast ? '' : 'translate-y-24 opacity-0 pointer-events-none')
        }
      >
        <span className="material-symbols-outlined text-secondary-fixed text-[20px]" style={iconFill}>info</span>
        <span className="font-label-md text-label-md">{toast}</span>
      </div>
    </div>
  )
}
