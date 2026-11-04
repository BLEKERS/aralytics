import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { getSession } from './api/client'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
// Public & auth
import LandingPage from './screens/public/LandingPage'
import LoginScreen from './screens/public/LoginScreen'
import AccountActivationScreen from './screens/public/AccountActivationScreen'
// Student view (/student/*) — each screen renders its own header from its Stitch export
import StudentDashboard from './screens/student/StudentDashboard'
import StudentMyActivities from './screens/student/StudentMyActivities'
import StudentLiveQuiz from './screens/student/StudentLiveQuiz'
import StudentDiagnosticReport from './screens/student/StudentDiagnosticReport'
import StudentProgressHistory from './screens/student/StudentProgressHistory'
// Teacher view (/teacher/*) — wrapped in the Sidebar + TopBar shell
import TeacherDashboard from './screens/teacher/TeacherDashboard'
import StudentsMasteryRoster from './screens/teacher/StudentsMasteryRoster'
import ActivitiesQuizManagement from './screens/teacher/ActivitiesQuizManagement'
import ClassReportsLearningAnalytics from './screens/teacher/ClassReportsLearningAnalytics'
import TeacherClassroomSettings from './screens/teacher/TeacherClassroomSettings'

function RequireAuth({ role, children }) {
  const location = useLocation()
  const session = getSession()

  if (!session?.token) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  const userRole = session.user?.role
  if (role && userRole && userRole !== role) {
    return (
      <Navigate
        replace
        to={userRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'}
      />
    )
  }

  return children
}

function AppShell({ children }) {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()
  const inTeacherApp = pathname.startsWith('/teacher/')

  if (!inTeacherApp) return children

  return (
    <>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setNavOpen(false)}
        ></div>
      )}
      <div className="lg:pl-[250px]">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main className="relative pt-[72px] bg-surface min-h-screen">{children}</main>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public & auth (own header/footer) */}
          <Route element={<LandingPage />} index path="/" />
          <Route element={<LoginScreen />} path="/login" />
          <Route element={<AccountActivationScreen />} path="/register" />
          <Route element={<Navigate replace to="/register" />} path="/activate" />

          {/* Student view */}
          <Route element={<RequireAuth role="STUDENT"><StudentDashboard /></RequireAuth>} path="/student/dashboard" />
          <Route element={<RequireAuth role="STUDENT"><StudentMyActivities /></RequireAuth>} path="/student/activities" />
          <Route element={<RequireAuth role="STUDENT"><StudentLiveQuiz /></RequireAuth>} path="/student/quiz" />
          <Route element={<RequireAuth role="STUDENT"><StudentDiagnosticReport /></RequireAuth>} path="/student/feedback" />
          <Route element={<RequireAuth role="STUDENT"><StudentProgressHistory /></RequireAuth>} path="/student/progress" />
          <Route element={<Navigate replace to="/student/feedback" />} path="/student/diagnostic-report" />
          <Route element={<Navigate replace to="/student/dashboard" />} path="/student" />
          <Route element={<Navigate replace to="/student/dashboard" />} path="/home" />

          {/* Teacher view (Sidebar + TopBar shell) */}
          <Route element={<RequireAuth role="TEACHER"><TeacherDashboard /></RequireAuth>} path="/teacher/dashboard" />
          <Route element={<RequireAuth role="TEACHER"><StudentsMasteryRoster /></RequireAuth>} path="/teacher/students" />
          <Route element={<RequireAuth role="TEACHER"><ActivitiesQuizManagement /></RequireAuth>} path="/teacher/activities" />
          <Route element={<RequireAuth role="TEACHER"><ClassReportsLearningAnalytics /></RequireAuth>} path="/teacher/reports" />
          <Route element={<RequireAuth role="TEACHER"><TeacherClassroomSettings /></RequireAuth>} path="/teacher/settings" />
          <Route element={<Navigate replace to="/teacher/dashboard" />} path="/teacher" />

          {/* Legacy flat teacher paths */}
          <Route element={<Navigate replace to="/teacher/dashboard" />} path="/dashboard" />
          <Route element={<Navigate replace to="/teacher/students" />} path="/students" />
          <Route element={<Navigate replace to="/teacher/activities" />} path="/activities" />
          <Route element={<Navigate replace to="/teacher/reports" />} path="/reports" />
          <Route element={<Navigate replace to="/teacher/settings" />} path="/settings" />

          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
