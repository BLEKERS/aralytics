import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'
import NotificationBell from '../NotificationBell'
import { getStoredUser, logout } from '../../api/client'

const STUDENT_NAV = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'My Activities', path: '/student/activities' },
  { label: 'Code Quiz & Exercises', path: '/student/quiz' },
  { label: 'AI Feedback History', path: '/student/feedback' },
  { label: 'My Progress & Skills', path: '/student/progress' },
]

export default function StudentHeader({ active }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = getStoredUser()

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.06)]">
      <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-lg">
          <BrandLogo to="/student/dashboard" />
          <nav className="hidden xl:flex items-center gap-space-xs bg-surface-container-low/70 p-1.5 rounded-2xl">
            {STUDENT_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  active === item.path
                    ? 'px-3.5 py-2 bg-surface-container-high text-primary font-label-lg text-label-lg font-bold rounded-xl transition-all'
                    : 'px-3.5 py-2 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="xl:hidden w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all shrink-0"
            onClick={() => setMenuOpen((value) => !value)}
            title="Menu"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          <NotificationBell
            role="student"
            buttonClassName="relative w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
          />
          <div className="flex items-center gap-space-sm pl-1 sm:pl-2">
            <Link
              className="flex items-center gap-2.5 bg-surface-container-low py-1.5 pl-2 pr-2 sm:pr-3.5 rounded-full"
              title="View profile"
              to="/profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold">
                  {user?.fullName || 'Student'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                  {user?.role === 'STUDENT' ? 'Student' : ''}
                </span>
              </div>
            </Link>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-all"
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
      </div>
      {menuOpen && (
        <div className="xl:hidden border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-xl px-gutter py-space-md flex flex-col gap-1">
          {STUDENT_NAV.map((item) => (
            <Link
              key={item.path}
              className={
                active === item.path
                  ? 'flex items-center px-3.5 py-2.5 rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg font-bold'
                  : 'flex items-center px-3.5 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container transition-all'
              }
              onClick={() => setMenuOpen(false)}
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
