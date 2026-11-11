import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import { api } from '../../api/client'
import { describeApiError } from '../../components/DataState'

const CURRENT_YEAR = new Date().getFullYear()

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status !== 'idle') return
    setError(null)
    setStatus('sending')
    try {
      await api.auth.forgotPassword({ email: email.trim() })
      setStatus('sent')
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
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h1 className="font-display-lg text-[30px] leading-[1.2] font-extrabold tracking-tight text-on-surface mt-space-xs">
                Forgot your password?
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[380px]">
                Enter the email on your account and we will send a reset link that expires in 15 minutes.
              </p>
            </div>

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

            {status === 'sent' ? (
              <div className="flex flex-col gap-space-md">
                <div className="rounded-2xl bg-secondary-container/40 p-space-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px] text-secondary shrink-0">mark_email_read</span>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    If an account exists for <span className="font-semibold text-on-surface">{email.trim()}</span>, a
                    reset link is on its way. Check your inbox and spam folder.
                  </p>
                </div>
                <Link
                  className="w-full py-3.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all"
                  to="/login"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-[15px] font-semibold text-on-surface" htmlFor="reset-email">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-outline absolute left-3.5 pointer-events-none text-[22px]">mail</span>
                    <input
                      autoComplete="email"
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-11 pr-4 py-3.5 rounded-xl font-body-lg text-[15px] transition-all focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_3px_rgba(91,75,219,0.22)]"
                      id="reset-email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@school.edu.ph"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </div>
                <button
                  className="w-full mt-2 py-4 px-6 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-[17px] font-bold flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(91,75,219,0.24)] transition-all active:scale-[0.99] disabled:opacity-60"
                  disabled={status !== 'idle'}
                  type="submit"
                >
                  {status === 'sending' ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      <span>Sending…</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
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
