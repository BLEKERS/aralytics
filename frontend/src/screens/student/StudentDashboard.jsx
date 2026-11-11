import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import NotificationBell from '../../components/NotificationBell'
import { api, getStoredUser, logout } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, EmptyBlock, LoadingBlock } from '../../components/DataState'

const CURRENT_YEAR = new Date().getFullYear()

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatRelative(value) {
  if (!value) return 'No attempts yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No attempts yet'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function masteryMeta(pct) {
  if (pct >= 85) {
    return { pill: 'Mastered', pillClass: 'text-secondary', bar: 'bg-secondary', text: 'text-secondary' }
  }
  if (pct >= 70) {
    return { pill: 'On Track', pillClass: 'text-primary', bar: 'bg-primary', text: 'text-primary' }
  }
  return {
    pill: 'Needs Nudge',
    pillClass: 'text-tertiary',
    bar: 'bg-tertiary-fixed-dim',
    text: 'text-tertiary',
  }
}

function conceptIcon(concept) {
  const key = (concept || '').toLowerCase()
  if (/loop|iterat/.test(key)) return 'sync'
  if (/list|dict|data structure|array/.test(key)) return 'dataset'
  if (/condition|branch|boolean|logic/.test(key)) return 'alt_route'
  if (/function|scope|class|oop/.test(key)) return 'code'
  if (/syntax|debug|error|variable/.test(key)) return 'bug_report'
  return 'school'
}

function conceptCategory(concept) {
  const key = (concept || '').toLowerCase()
  if (/loop|condition|branch|logic/.test(key)) return 'Algorithms'
  if (/list|dict|data structure|array/.test(key)) return 'Data Structures'
  if (/function|scope|class|oop/.test(key)) return 'OOP Fundamentals'
  return 'Python Fundamentals'
}

export default function StudentDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)

  const dashboard = useApiResource(() => api.student.dashboard(), [])
  const activities = useApiResource(() => api.student.activities(), [])

  const user = getStoredUser()
  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const fullName = user?.fullName || 'Student'

  const streakDays = dashboard.data?.streak?.activeDaysLast7 ?? 0
  const conceptMastery = (Array.isArray(dashboard.data?.conceptMastery)
    ? dashboard.data.conceptMastery
    : []
  )
    .map((concept) => ({ ...concept, pct: clampPercent(concept.masteryLevel) }))
    .sort((a, b) => b.pct - a.pct)

  const activityList = Array.isArray(activities.data) ? activities.data : []
  const pendingActivities = activityList.filter((activity) => activity.status !== 'COMPLETED')
  const priorityActivity =
    activityList.find((activity) => activity.status === 'REMEDIAL') ||
    pendingActivities[0] ||
    activityList[0] ||
    null
  const recentScore = Array.isArray(dashboard.data?.recentScores)
    ? dashboard.data.recentScores[0]
    : null
  const completedCount = dashboard.data?.completedCount ?? 0
  const assignedCount = dashboard.data?.assignedCount ?? activityList.length
  const strongestConcept = conceptMastery[0] || null
  const weakestConcept = conceptMastery.length
    ? conceptMastery[conceptMastery.length - 1]
    : null

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.06)]">
        <div className="h-20 max-w-[1120px] mx-auto px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <BrandLogo to="/student/dashboard" />
            <nav
              className="hidden xl:flex items-center gap-space-xs"
              data-active-classes="bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full px-space-md py-space-xs shadow-[0_2px_8px_rgba(91,75,219,0.15)]"
            >
              <Link
                aria-current="page"
                className="transition-colors bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full px-space-md py-space-xs shadow-[0_2px_8px_rgba(91,75,219,0.15)]"
                data-path="home"
                to="/student/dashboard"
              >
                Home
              </Link>
              <Link
                className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                data-path="my-quizzes-activities"
                to="/student/activities"
              >
                My Quizzes &amp; Activities
              </Link>
              <Link
                className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                data-path="my-progress-badges"
                to="/student/progress"
              >
                My Progress &amp; Badges
              </Link>
              <Link
                className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                data-path="aral-ai-feedback"
                to="/student/feedback"
              >
                Aral AI Feedback
              </Link>
            </nav>
            <button
              aria-expanded={menuOpen}
              aria-label="Open navigation menu"
              className="xl:hidden w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="hidden sm:flex items-center gap-space-xs bg-surface-container px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                local_fire_department
              </span>
              <span className="font-label-md text-label-md font-bold text-on-surface">5 Days</span>
            </div>
            <div className="hidden md:flex items-center gap-space-xs bg-secondary-fixed/50 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[18px] text-secondary">bolt</span>
              <span className="font-label-md text-label-md font-bold text-secondary">320 XP</span>
            </div>
            <NotificationBell
              role="student"
              buttonClassName="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            />
            <Link
              className="flex items-center gap-space-sm pl-space-xs"
              title="View profile"
              to="/profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">
                  {fullName}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                  Python &amp; CS Track
                </span>
              </div>
            </Link>
            <button
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
              onClick={async () => {
                await logout()
                window.location.assign('/login')
              }}
              title="Sign out"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="xl:hidden border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-xl px-gutter py-space-md flex flex-col gap-1">
            <Link
              className="flex items-center px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold"
              onClick={() => setMenuOpen(false)}
              to="/student/dashboard"
            >
              Home
            </Link>
            <Link
              className="flex items-center px-space-md py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              onClick={() => setMenuOpen(false)}
              to="/student/activities"
            >
              My Quizzes &amp; Activities
            </Link>
            <Link
              className="flex items-center px-space-md py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              onClick={() => setMenuOpen(false)}
              to="/student/progress"
            >
              My Progress &amp; Badges
            </Link>
            <Link
              className="flex items-center px-space-md py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              onClick={() => setMenuOpen(false)}
              to="/student/feedback"
            >
              Aral AI Feedback
            </Link>
            <Link
              className="flex items-center gap-2 px-space-md py-2.5 rounded-xl font-label-lg text-label-lg text-error hover:bg-error-container/40 transition-colors mt-1 border-t border-outline-variant/20 pt-3"
              onClick={() => setMenuOpen(false)}
              to="/login"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </Link>
          </div>
        )}
      </header>
      <main className="w-full pt-20 bg-background max-w-[1120px] mx-auto px-gutter">
        <div className="flex flex-col w-full pb-16">
          {(dashboard.loading || activities.loading) && (
            <div className="pt-6">
              <LoadingBlock label="Loading your dashboard from the backend…" />
            </div>
          )}
          {(dashboard.error || activities.error) && (
            <div className="pt-6">
              <DataError
                error={dashboard.error || activities.error}
                onRetry={() => {
                  dashboard.reload()
                  activities.reload()
                }}
              />
            </div>
          )}
          {/* Top Greeting & Motivation Banner Section */}
          <section className="w-full pt-6 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div>
                <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container text-primary font-label-md text-label-md mb-2">
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  <span className="">Python 101 • Section Py-B</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold flex items-center gap-2">
                  Kumusta, {firstName}!{' '}
                  <span className="inline-block hover:rotate-12 transition-transform cursor-pointer">
                    👋
                  </span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                  Ready for your next coding drill today? You have{' '}
                  <span className="font-bold text-on-surface">{pendingActivities.length}</span> assigned{' '}
                  {pendingActivities.length === 1 ? 'activity' : 'activities'} waiting.
                </p>
              </div>
              {/* Quick Student Metric Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    military_tech
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Lvl 4 Explorer
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    leaderboard
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Rank #3
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    local_fire_department
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    {streakDays} {streakDays === 1 ? 'Day' : 'Days'} 🔥
                  </span>
                </div>
              </div>
            </div>
            {/* Coral Streak Urgency Banner */}
            <div className="mt-5 w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">crisis_alert</span>
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface font-bold">
                    {streakDays > 0 ? `${streakDays}-Day Streak Active` : 'Start your streak today'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {streakDays > 0
                      ? 'Complete 1 drill today to keep your streak alive and earn +25 XP.'
                      : 'Complete your first drill today to start a new streak and earn +25 XP.'}
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shrink-0"
                to={priorityActivity ? `/student/quiz?id=${priorityActivity.id}` : '/student/activities'}
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                <span className="">Quick Drill</span>
              </Link>
            </div>
          </section>
          {/* Main Bento Grid (Hero Priority Drill 8 cols + Aral AI Coach 4 cols) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mt-3">
            <div className="lg:col-span-7 xl:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                {priorityActivity ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-label-sm text-label-sm font-semibold">
                          {priorityActivity.topic || priorityActivity.className || 'Python Programming'}
                        </span>
                        <span className="text-on-surface-variant text-[11px]">•</span>
                        <span className="text-secondary font-label-sm text-label-sm font-bold">
                          {priorityActivity.status === 'REMEDIAL' ? 'Remedial Drill' : 'Assigned Activity'}
                        </span>
                      </div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">
                        Due {formatDue(priorityActivity.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                        {priorityActivity.title}
                      </h2>
                      <div className="w-11 h-11 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">data_object</span>
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed max-w-2xl">
                      {priorityActivity.description ||
                        `${priorityActivity.className || 'Your class'} has assigned this ${priorityActivity.questionCount}-question activity. Open it to review the questions and track your progress.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 my-5 pt-1">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          quiz
                        </span>
                        <span className="font-body-sm text-body-sm font-medium">
                          {priorityActivity.questionCount} Questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          schedule
                        </span>
                        <span className="font-body-sm text-body-sm font-medium">
                          ~{Math.max(5, priorityActivity.questionCount * 2)} Minutes
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          target
                        </span>
                        <span className="font-body-sm text-body-sm font-medium">
                          {priorityActivity.score != null
                            ? `${Math.round(Number(priorityActivity.score))}% scored`
                            : '80% Mastery Goal'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                      No activities assigned yet
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Your teacher has not published an activity for this class yet. Check back soon.
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                  to={priorityActivity ? `/student/quiz?id=${priorityActivity.id}` : '/student/activities'}
                >
                  <span className="">{priorityActivity ? 'Start Quiz Now' : 'View Activities'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container-high transition-colors"
                  to="/student/activities"
                >
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span className="">Preview Details</span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 xl:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Aral Coach AI
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        {recentScore ? `Latest: ${recentScore.quizTitle}` : 'Live mastery summary'}
                      </p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    Diagnostic
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container-low mt-2">
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    {recentScore
                      ? `Your latest score was ${Math.round(Number(recentScore.score))}% on “${recentScore.quizTitle}” (${formatRelative(recentScore.submittedAt)}). `
                      : 'Complete an activity to unlock personalized coaching. '}
                    {weakestConcept
                      ? `Focus next on ${weakestConcept.concept}, currently at ${weakestConcept.pct}% mastery.`
                      : 'Your concept mastery will appear here after your first submission.'}
                  </p>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="p-2.5 rounded-lg bg-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      check_circle
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {strongestConcept
                        ? `Strongest: ${strongestConcept.concept} (${strongestConcept.pct}%)`
                        : 'No mastery evidence yet'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[16px]">
                      lightbulb
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {weakestConcept ? `Focus next: ${weakestConcept.concept}` : 'Take a quiz to reveal focus areas'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 flex flex-col gap-1.5">
                <Link
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors"
                  to={priorityActivity ? `/student/quiz?id=${priorityActivity.id}` : '/student/activities'}
                >
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                  <span className="">
                    {weakestConcept ? `Practice ${weakestConcept.concept}` : 'Find a practice activity'}
                  </span>
                </Link>
                <Link
                  className="w-full text-center py-1 text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors"
                  to="/student/feedback"
                >
                  View All Feedback
                </Link>
              </div>
            </div>
          </section>
          {/* Subject Mastery & Progress Overview Section */}
          <section className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                    Subject Mastery Breakdown
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Real-time adaptive assessment scores mapped to Computer Science competencies
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container transition-colors font-bold self-start sm:self-auto"
                to="/student/progress"
              >
                <span className="">View CS Skill Matrix</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Link>
            </div>
            {/* 4 Mastery Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {conceptMastery.slice(0, 4).map((concept) => {
                const meta = masteryMeta(concept.pct)
                const iconColor =
                  concept.pct >= 85 ? 'text-secondary' : concept.pct >= 70 ? 'text-primary' : 'text-tertiary'
                return (
                  <div
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                    key={concept.conceptId ?? concept.concept}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center ${iconColor}`}>
                          <span className="material-symbols-outlined text-[18px]">{conceptIcon(concept.concept)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-semibold ${meta.pillClass}`}>
                          {meta.pill}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {conceptCategory(concept.concept)}
                      </span>
                      <h4 className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">
                        {concept.concept}
                      </h4>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Mastery
                        </span>
                        <span className={`font-label-lg text-label-lg font-bold ${meta.text}`}>{concept.pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${concept.pct}%` }}></div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 text-[11px]">
                        Updated {formatRelative(concept.lastUpdated)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {conceptMastery.length === 0 && (
                <div className="md:col-span-2 lg:col-span-4">
                  <EmptyBlock
                    icon="insights"
                    title="No mastery data yet"
                    message="Concept mastery appears here after you submit a published activity."
                  />
                </div>
              )}
            </div>
          </section>
          {/* Two-Column Bottom Section (Learning Path & Gamification) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mt-10">
            {/* Left Column: Learning Path & Upcoming Quizzes (6 cols) */}
            <div className="lg:col-span-6 bg-surface-container-lowest rounded-[20px] p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-high mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        calendar_month
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                        Your Learning Path
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Upcoming coding drills assigned by your mentors
                      </p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold bg-surface-container px-2.5 py-1 rounded-full">
                    {pendingActivities.length} Assigned
                  </span>
                </div>
                <div className="space-y-3.5">
                  {pendingActivities.slice(0, 2).map((activity, index) => (
                    <div
                      className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      key={activity.id}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${index === 0 ? 'bg-secondary-fixed/40 text-secondary' : 'bg-primary-fixed text-primary'}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {index === 0 ? 'terminal' : 'data_object'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-label-sm text-label-sm font-bold ${index === 0 ? 'text-secondary' : 'text-primary'}`}>
                              {activity.topic || activity.className || 'Python 101'}
                            </span>
                            <span className="text-on-surface-variant text-[11px]">•</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                              {activity.status === 'REMEDIAL'
                                ? 'Remedial Drill'
                                : activity.status === 'OVERDUE'
                                  ? 'Overdue'
                                  : 'Assigned Activity'}
                            </span>
                          </div>
                          <h4 className="font-label-lg text-label-lg text-on-surface font-extrabold mt-0.5">
                            {activity.title}
                          </h4>
                          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm mt-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="">Due {formatDue(activity.dueDate)}</span>
                            <span className="">•</span>
                            <span className="">{activity.questionCount} questions</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest text-primary font-label-md text-label-md font-bold shadow-sm hover:bg-primary hover:text-on-primary transition-all self-start sm:self-auto shrink-0"
                        to={`/student/quiz?id=${activity.id}`}
                      >
                        <span className="">Start</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </Link>
                    </div>
                  ))}
                  {pendingActivities.length === 0 && (
                    <div className="p-4 rounded-2xl bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
                      You are all caught up — no assigned activities are waiting. Check My Activities for completed work.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-surface-container-high flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Looking for older activities?
                </span>
                <Link
                  className="font-label-md text-label-md text-primary font-bold hover:underline"
                  to="/student/activities"
                >
                  View All Completed Drills →
                </Link>
              </div>
            </div>
            {/* Right Column: Gamification & Weekly Milestones (6 cols) */}
            <div className="lg:col-span-6 bg-surface-container-lowest rounded-[20px] p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      emoji_events
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Milestones
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Week 14
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 72 72">
                      <circle
                        className="text-surface-container"
                        cx="36"
                        cy="36"
                        fill="none"
                        r="30"
                        stroke="currentColor"
                        strokeWidth="6"
                      />
                      <circle
                        className="text-primary"
                        cx="36"
                        cy="36"
                        fill="none"
                        r="30"
                        stroke="currentColor"
                        strokeDasharray="188.4"
                        strokeDashoffset={188.4 * (1 - (assignedCount ? Math.min(completedCount, assignedCount) / assignedCount : 0))}
                        strokeLinecap="round"
                        strokeWidth="6"
                      />
                    </svg>
                    <span className="absolute font-label-md text-label-md text-on-surface font-bold">
                      {Math.min(completedCount, assignedCount)}/{assignedCount}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-label-md text-on-surface font-bold">
                      Activity Completion Goal
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {assignedCount > 0 && completedCount >= assignedCount
                        ? 'All assigned activities are complete. Nice work!'
                        : `Complete ${Math.max(0, assignedCount - completedCount)} more ${
                            assignedCount - completedCount === 1 ? 'activity' : 'activities'
                          } to finish this cycle.`}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Recent Badges
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      12 total
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center text-center">
                      <span className="material-symbols-outlined text-tertiary text-[22px] mb-1">
                        local_fire_department
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                        3-Day Streak
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center text-center">
                      <span className="material-symbols-outlined text-primary text-[22px] mb-1">
                        bug_report
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                        Debug Ace
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center text-center">
                      <span className="material-symbols-outlined text-secondary text-[22px] mb-1">
                        bolt
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                        Speed Coder
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-surface-container-high flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Next: Python Master II
                </span>
                <Link
                  className="font-label-sm text-label-sm text-primary font-bold hover:underline"
                  to="/student/progress"
                >
                  All Badges →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="w-full bg-surface-container-lowest mt-space-xl py-space-lg shadow-[0_-1px_8px_rgba(91,75,219,0.04)]">
        <div className="max-w-[1120px] mx-auto px-gutter flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left">
          <div className="flex items-center gap-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Pagsulong sa Karunungan
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            © {CURRENT_YEAR} Aralytics Learning Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
