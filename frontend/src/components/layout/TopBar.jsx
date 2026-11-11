import { Link } from 'react-router-dom'
import NotificationBell from '../NotificationBell'
import { logout } from '../../api/client'

const PROFILE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuChrfifem-pX-5-2ww20HzrO-M3nr7zLtmPi9Ix5-PCHl7pi5uQZlXPj6xHOAyG6JWBzxOozhXH5fuP6gRofSlFOKpUzMOpRg73l4PI5TaIX7ObErToVfnbzhJy2ghX0wDrjK6Lj3QfAiVzzaEcBSb7jWbHlaU0lIU4nC-1cCexq0ACsLAItVy1LwoUNeA06eShYWT0UaFkkl2Fbh-zjihrqjqhdUFLP2Zuz78Kyv-Wx6wEB5ZpfYTQrQ'

export default function TopBar({ onMenu }) {
  return (
    <header className="fixed top-0 left-0 lg:left-[250px] right-0 h-[72px] bg-surface-container-lowest/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(91,75,219,0.06)]">
      <div className="h-[72px] px-space-lg flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <button
            className="lg:hidden p-2 -ml-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Open navigation"
            type="button"
            onClick={onMenu}
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-xs rounded-full cursor-pointer hover:bg-surface-container-high transition-colors">
            <span className="font-label-md text-label-md text-on-surface hidden sm:block">
              💻 CS 101: Intro to Python (Sec A · 42 students)
            </span>
            <span className="font-label-md text-label-md text-on-surface sm:hidden">
              CS 101
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-space-md flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-10 pr-4 py-2 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
              placeholder="Search student, assignment, syntax error..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <NotificationBell role="teacher" />
          <Link
            className="flex items-center gap-space-xs bg-primary-container text-on-primary px-space-md py-2 rounded-xl font-label-md text-label-md hover:bg-primary transition-colors shadow-sm"
            to="/teacher/activities"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden md:inline">New Activity</span>
            <span className="md:hidden">Add</span>
          </Link>
          <Link className="flex items-center pl-space-xs" title="View profile" to="/profile">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container/20"
              src={PROFILE_URL}
              onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
            />
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
    </header>
  )
}
