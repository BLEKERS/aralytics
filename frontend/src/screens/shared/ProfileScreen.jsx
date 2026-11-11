import { useEffect, useState } from 'react'
import StudentHeader from '../../components/student/StudentHeader'
import { api, getStoredUser } from '../../api/client'
import { useApiResource } from '../../api/useApiResource'
import { DataError, LoadingBlock } from '../../components/DataState'

const FIELD =
  'w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all'

function Notice({ notice }) {
  if (!notice) return null
  const error = notice.tone === 'error'
  return (
    <div
      className={`rounded-xl px-space-md py-space-sm font-label-md text-label-md font-semibold ${
        error
          ? 'bg-error-container text-on-error-container'
          : 'bg-secondary-container text-on-secondary-container'
      }`}
      role={error ? 'alert' : 'status'}
    >
      {notice.text}
    </div>
  )
}

export default function ProfileScreen() {
  const isTeacher = getStoredUser()?.role === 'TEACHER'
  const Shell = isTeacher ? 'div' : 'main'
  const profile = useApiResource(() => api.auth.profile(), [])
  const user = profile.data?.user

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileNotice, setProfileNotice] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState(null)

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName || '')
    setUsername(user.username || '')
  }, [user])

  async function saveProfile(event) {
    event.preventDefault()
    setProfileNotice(null)
    setSavingProfile(true)
    try {
      await api.auth.updateProfile({ fullName, username })
      setProfileNotice({ tone: 'success', text: 'Profile updated.' })
      profile.reload()
    } catch (error) {
      setProfileNotice({ tone: 'error', text: error.message })
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setPasswordNotice(null)
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ tone: 'error', text: 'New passwords do not match.' })
      return
    }
    setSavingPassword(true)
    try {
      await api.auth.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordNotice({ tone: 'success', text: 'Password changed.' })
    } catch (error) {
      setPasswordNotice({ tone: 'error', text: error.message })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className={isTeacher ? 'bg-surface' : 'bg-surface min-h-screen flex flex-col'}>
      {!isTeacher && <StudentHeader />}
      <Shell className={isTeacher ? 'w-full' : 'w-full pt-20 flex-1'}>
        <div className="max-w-[1120px] mx-auto px-space-md lg:px-space-xl py-space-lg flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              Account
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">My Profile</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              View your account details and keep your sign-in information up to date.
            </p>
          </div>

          {profile.loading && <LoadingBlock label="Loading your profile…" />}
          {profile.error && <DataError error={profile.error} onRetry={profile.reload} />}

          {user && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
              <section className="xl:col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_rgba(91,75,219,0.08)] flex flex-col gap-space-md">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Account Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  {[
                    ['Email', user.email],
                    ['Role', user.role === 'TEACHER' ? 'Teacher' : 'Student'],
                    ['School', user.schoolName || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface break-words">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <form className="flex flex-col gap-space-sm" onSubmit={saveProfile}>
                  <label className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-on-surface">Full Name</span>
                    <input
                      className={FIELD}
                      maxLength={160}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      value={fullName}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-on-surface">Username</span>
                    <input
                      className={FIELD}
                      maxLength={64}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      value={username}
                    />
                  </label>
                  <Notice notice={profileNotice} />
                  <button
                    className="self-start flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary px-space-lg py-2.5 rounded-xl font-label-lg text-label-lg shadow-[0_4px_16px_rgba(91,75,219,0.24)] transition-all disabled:opacity-50"
                    disabled={savingProfile}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {savingProfile ? 'Saving…' : 'Save Profile'}
                  </button>
                </form>
              </section>

              <section className="xl:col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_rgba(91,75,219,0.08)] flex flex-col gap-space-md">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Change Password</h2>
                <form className="flex flex-col gap-space-sm" onSubmit={savePassword}>
                  <label className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      Current Password
                    </span>
                    <input
                      autoComplete="current-password"
                      className={FIELD}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      type="password"
                      value={currentPassword}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-on-surface">New Password</span>
                    <input
                      autoComplete="new-password"
                      className={FIELD}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      type="password"
                      value={newPassword}
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      8–72 characters with at least one number.
                    </span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      Confirm New Password
                    </span>
                    <input
                      autoComplete="new-password"
                      className={FIELD}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </label>
                  <Notice notice={passwordNotice} />
                  <button
                    className="self-start flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary px-space-lg py-2.5 rounded-xl font-label-lg text-label-lg shadow-[0_4px_16px_rgba(91,75,219,0.24)] transition-all disabled:opacity-50"
                    disabled={savingPassword}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </Shell>
    </div>
  )
}
