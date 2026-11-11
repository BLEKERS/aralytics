import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import { api } from '../../api/client'
import { describeApiError } from '../../components/DataState'

const CURRENT_YEAR = new Date().getFullYear()
const PASSWORD_RULE = /^(?=.*\d).{8,72}$/

export default function ResetPasswordScreen() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordValid = PASSWORD_RULE.test(password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status !== 'idle') return
    setError(null)
    if (!passwordValid) {
      setError(new Error('Password must be 8-72 characters and contain at least one number.'))
      return
    }
    if (!passwordsMatch) {
      setError(new Error('Passwords do not match. Re-enter both passwords.'))
      return
    }
    setStatus('saving')
    try {
      await api.auth.resetPassword({ token, newPassword: password })
      setStatus('done')
    } catch (err) {
      setError(err)
      setStatus('idle')
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col justify-between antialiased selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <header className="w-full bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.04)]">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin h-20 flex items-center justify-between">
          <BrandLogo to="/" />
          <Link className="flex items-center gap-1.5 font-label-lg text-[15px] font-medium text-on-surface-variant hover:text-primary transition-colors" to="/login">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to sign in</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-margin-mobile md:px-margin py-space-xl flex items-center justify-center">
        <div className="w-full max-w-[480px]">
          <div
            className="bg-surface-container-lowest rounded-[24px] p-space-lg sm:p-space-xl flex flex-col gap-space-lg"
            style={{
              boxShadow:
                'rgba(91, 75, 219, 0.12) 0px 20px 40px -15px, rgba(0, 0, 0, 0.04) 0px 0px 25px 0px, rgba(15, 23, 42, 0.14) 0px 35px 60px -15px',
              border: '1px solid rgba(200, 196, 215, 0.45)',
            }}
          >
            <div className="flex flex-col items-center text-center gap-space-xs">
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px]">password</span>
              </div>
              <h1 className="font-display-lg text-[30px] leading-[1.2] font-extrabold tracking-tight text-on-surface mt-space-xs">
                Set a new password
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[380px]">
                Choose a password with at least 8 characters and one number.
              </p>
            </div>

            {!token && (
              <div className="rounded-2xl bg-error-container/50 border border-error/20 p-space-md flex items-start gap-3" role="alert">
                <span className="material-symbols-outlined text-[22px] text-error shrink-0">link_off</span>
                <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
                  This reset link is missing its token. Request a new link from the{' '}
                  <Link className="text-primary font-semibold hover:underline" to="/forgot-password">
                    forgot password
                  </Link>{' '}
                  page.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border bg-error-container/50 border-error/20 p-space-md flex items-start gap-3" role="alert">
                <span className="material-symbols-outlined text-[22px] text-error shrink-0">
                  {describeApiError(error)?.icon || 'error'}
                </span>
                <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
                  {describeApiError(error)?.message}
                </p>
              </div>
            )}

            {status === 'done' ? (
              <div className="flex flex-col gap-space-md">
                <div className="rounded-2xl bg-secondary-container/40 p-space-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px] text-secondary shrink-0">check_circle</span>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Your password has been updated. Sign in with your new password.
                  </p>
                </div>
                <Link
                  className="w-full py-3.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all"
                  to="/login"
                >
                  Go to sign in
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-[15px] font-semibold text-on-surface" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-outline absolute left-3.5 pointer-events-none text-[22px]">lock</span>
                    <input
                      autoComplete="new-password"
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-11 pr-11 py-3.5 rounded-xl font-body-lg text-[15px] transition-all focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_3px_rgba(91,75,219,0.22)]"
                      id="new-password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3 text-outline hover:text-on-surface p-1.5 rounded-lg transition-colors"
                      onClick={() => setShowPassword((prev) => !prev)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-[15px] font-semibold text-on-surface" htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-outline absolute left-3.5 pointer-events-none text-[22px]">lock_reset</span>
                    <input
                      autoComplete="new-password"
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-11 pr-11 py-3.5 rounded-xl font-body-lg text-[15px] transition-all focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_3px_rgba(91,75,219,0.22)]"
                      id="confirm-new-password"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant font-label-md text-label-md">
                  <span className={`flex items-center gap-1.5 ${passwordValid ? 'text-secondary' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {passwordValid ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    8+ characters &amp; 1 number
                  </span>
                  <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-secondary' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {passwordsMatch ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    Passwords match
                  </span>
                </div>

                <button
                  className="w-full mt-2 py-4 px-6 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-[17px] font-bold flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(91,75,219,0.24)] transition-all active:scale-[0.99] disabled:opacity-60"
                  disabled={status !== 'idle' || !token}
                  type="submit"
                >
                  {status === 'saving' ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span>Update password</span>
                      <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-container-low/60 py-space-lg">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin text-center">
          <span className="font-body-md text-[13.5px] text-on-surface-variant">
            © {CURRENT_YEAR} Aralytics Platform. Empowering learners and educators nationwide.
          </span>
        </div>
      </footer>
    </div>
  )
}
