import { NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'
import { getStoredUser, logout } from '../../api/client'

const NAV_ITEMS = [
  { path: '/teacher/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/teacher/students', icon: 'group', label: 'Students' },
  { path: '/teacher/activities', icon: 'assignment', label: 'Activities' },
  { path: '/teacher/reports', icon: 'insights', label: 'Reports' },
  { path: '/teacher/settings', icon: 'settings', label: 'Settings' },
]

const PROFILE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuChrfifem-pX-5-2ww20HzrO-M3nr7zLtmPi9Ix5-PCHl7pi5uQZlXPj6xHOAyG6JWBzxOozhXH5fuP6gRofSlFOKpUzMOpRg73l4PI5TaIX7ObErToVfnbzhJy2ghX0wDrjK6Lj3QfAiVzzaEcBSb7jWbHlaU0lIU4nC-1cCexq0ACsLAItVy1LwoUNeA06eShYWT0UaFkkl2Fbh-zjihrqjqhdUFLP2Zuz78Kyv-Wx6wEB5ZpfYTQrQ'

export default function Sidebar({ open = false, onClose }) {
  const user = getStoredUser()

  const handleLogout = async (event) => {
    event.preventDefault()
    await logout()
    window.location.assign('/login')
  }

  return (
    <aside
      className={`${
        open ? 'flex' : 'hidden'
      } lg:flex fixed left-0 top-0 h-screen w-[250px] max-w-[85vw] bg-surface-container-lowest z-50 flex-col justify-between shadow-[0_1px_8px_rgba(91,75,219,0.06)] transition-transform duration-300`}
    >
      <div className="flex flex-col">
        <div className="h-[72px] flex items-center px-space-lg gap-space-sm">
          <BrandLogo to="/teacher/dashboard" />
        </div>
        <nav className="flex flex-col gap-space-xs px-space-md mt-space-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-on-surface-variant font-label-lg text-label-lg transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
              to={item.path}
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-space-md m-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
        <Link className="flex items-center gap-space-sm min-w-0" title="View profile" to="/profile">
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover shrink-0"
            src={PROFILE_URL}
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface truncate">
              {user?.fullName || 'Teacher'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              High School CS
            </span>
          </div>
        </Link>
        <Link
          className="text-on-surface-variant hover:text-primary transition-colors p-space-xs"
          onClick={handleLogout}
          title="Sign out"
          to="/login"
        >
          <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
        </Link>
      </div>
    </aside>
  )
}
