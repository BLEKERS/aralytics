import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { api, saveSession } from '../../api/client';
import { describeApiError } from '../../components/DataState';

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_CREDENTIALS = {
  student: {
    identifier: 'miguel@school.edu.ph',
    password: 'student123',
  },
  teacher: {
    identifier: 'maria.santos@university.edu.ph',
    password: 'teacher123',
  },
};

export default function LoginScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState(DEFAULT_CREDENTIALS.student.identifier);
  const [password, setPassword] = useState(DEFAULT_CREDENTIALS.student.password);
  const [showPassword, setShowPassword] = useState(false);
  const [authState, setAuthState] = useState('idle');
  const [error, setError] = useState(null);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setIdentifier(DEFAULT_CREDENTIALS[nextRole].identifier);
    setPassword(DEFAULT_CREDENTIALS[nextRole].password);
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (authState !== 'idle') return;
    setAuthState('authenticating');
    setError(null);

    try {
      const auth = await api.auth.login({
        identifier: identifier.trim(),
        password,
      });
      saveSession(auth);
      setAuthState('authenticated');
      // Trust the role returned by the backend, not the selected tab.
      navigate(auth.user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(err);
      setAuthState('idle');
    }
  };

  const isStudent = role === 'student';
  const errorInfo = describeApiError(error);
  const loginErrorMessage =
    error?.status === 401
      ? 'Incorrect email, ID, or password. Check your credentials and try again.'
      : errorInfo?.message;

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col justify-between antialiased selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <header className="w-full bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.04)]">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin h-20 flex items-center justify-between">
          <BrandLogo to="/" />
          <div className="flex items-center gap-space-lg">
            <a className="flex items-center gap-1.5 font-label-lg text-[15px] font-medium text-on-surface-variant hover:text-primary transition-colors" data-path="support" href="#">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="">Help &amp; Support</span>
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-margin-mobile md:px-margin py-space-xl flex items-center justify-center">
        <div className="flex flex-col w-full items-center justify-center py-space-sm sm:py-space-md">
          {/* Subtle decorative ambient glows (bounded in card scope) */}
          <div className="w-full max-w-[480px] relative">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-secondary-container/30 rounded-full blur-2xl pointer-events-none"></div>
            {/* Main Login Card */}
            <div
              className="relative bg-surface-container-lowest rounded-[24px] shadow-[0_12px_36px_rgba(91,75,219,0.08)] p-space-lg sm:p-space-xl flex flex-col gap-space-lg"
              style={{
                boxShadow:
                  'rgba(91, 75, 219, 0.12) 0px 20px 40px -15px, rgba(0, 0, 0, 0.04) 0px 0px 25px 0px, rgba(15, 23, 42, 0.14) 0px 35px 60px -15px',
                border: '1px solid rgba(200, 196, 215, 0.45)',
              }}
            >
              {/* Card Branding & Heading */}
              <div className="flex flex-col items-center text-center gap-space-xs">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-[0_4px_16px_rgba(91,75,219,0.12)]">
                  <span className="material-symbols-outlined text-[26px]">terminal</span>
                </div>
                <h1 className="font-display-lg text-[32px] leading-[1.2] font-extrabold tracking-tight text-on-surface mt-space-xs text-balance">
                  Welcome to Aralytics
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[380px]">
                  AI-Powered Coding Diagnostics &amp; Feedback
                </p>
              </div>
              {/* Role Selector Switcher */}
              <div className="bg-surface-container-low p-1 rounded-xl flex items-center gap-1">
                <button
                  className={
                    isStudent
                      ? 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[15px] font-semibold transition-all flex items-center justify-center gap-space-xs bg-surface-container-lowest text-primary shadow-sm'
                      : 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[15px] font-medium transition-all flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface'
                  }
                  id="btn-role-student"
                  onClick={() => handleRoleChange('student')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">school</span>
                  <span className="">Student</span>
                </button>
                <button
                  className={
                    !isStudent
                      ? 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[15px] font-semibold transition-all flex items-center justify-center gap-space-xs bg-surface-container-lowest text-primary shadow-sm'
                      : 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[15px] font-medium transition-all flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface'
                  }
                  id="btn-role-teacher"
                  onClick={() => handleRoleChange('teacher')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">person_check</span>
                  <span className="">Teacher / Educator</span>
                </button>
              </div>
              {/* API error / offline banner */}
              {error && (
                <div
                  className={`rounded-2xl border p-space-md flex items-start gap-3 ${
                    errorInfo?.tone === 'warning'
                      ? 'bg-tertiary-fixed/40 border-tertiary/20'
                      : 'bg-error-container/50 border-error/20'
                  }`}
                  role="alert"
                >
                  <span
                    className={`material-symbols-outlined text-[22px] shrink-0 ${
                      errorInfo?.tone === 'warning' ? 'text-tertiary' : 'text-error'
                    }`}
                  >
                    {errorInfo?.icon || 'error'}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`font-label-lg text-[15px] font-bold ${
                        errorInfo?.tone === 'warning' ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      {error?.status === 401 ? 'Sign-in failed' : errorInfo?.title}
                    </p>
                    <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
                      {loginErrorMessage}
                    </p>
                    {error?.isOffline && (
                      <p className="font-body-sm text-[12px] text-outline mt-1">
                        Run the backend on port 8080 or set VITE_API_BASE_URL, then retry.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* Login Form */}
              <form className="flex flex-col gap-space-md" id="login-form" onSubmit={handleLogin}>
                {/* Identifier Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-[15px] font-semibold text-on-surface flex items-center justify-between" htmlFor="identifier-input" id="identifier-label">
                    <span className="">{isStudent ? 'Student ID or Institutional Email' : 'School Email or Teacher ID'}</span>
                    <span
                      className={
                        isStudent
                          ? 'font-label-sm text-[12px] text-primary bg-primary-fixed/60 px-2.5 py-0.5 rounded-full font-medium'
                          : 'font-label-sm text-[12px] text-secondary bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full font-medium'
                      }
                      id="role-badge"
                    >
                      {isStudent ? 'Student Access' : 'Faculty & Staff'}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-outline absolute left-3.5 pointer-events-none text-[22px]">badge</span>
                    <input
                      autoComplete="username"
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-11 pr-4 py-3.5 rounded-xl font-body-lg text-[15px] transition-all focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_3px_rgba(91,75,219,0.22)]"
                      id="identifier-input"
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        isStudent
                          ? 'e.g. s2024-9102 or miguel@school.edu.ph'
                          : 'e.g. maria.santos@university.edu.ph'
                      }
                      required
                      type="text"
                      value={identifier}
                    />
                  </div>
                </div>
                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-lg text-[15px] font-semibold text-on-surface" htmlFor="password-input">
                      Password
                    </label>
                    <a className="font-label-md text-[13px] text-primary hover:text-on-primary-fixed-variant transition-colors font-medium" href="#">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-outline absolute left-3.5 pointer-events-none text-[22px]">lock</span>
                    <input
                      autoComplete="current-password"
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-11 pr-11 py-3.5 rounded-xl font-body-lg text-[15px] transition-all focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_3px_rgba(91,75,219,0.22)]"
                      id="password-input"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3 text-outline hover:text-on-surface flex items-center justify-center p-1.5 rounded-lg transition-colors"
                      id="toggle-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[22px]" id="password-visibility-icon">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                {/* Remember Device & Fast Status */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div className="relative flex items-center">
                      <input className="peer sr-only" id="remember-me" type="checkbox" />
                      <div className="w-5 h-5 rounded-md bg-surface-container-low peer-checked:bg-primary transition-all flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-on-primary text-[15px] opacity-0 peer-checked:opacity-100 transition-opacity">
                          check
                        </span>
                      </div>
                    </div>
                    <span className="font-body-md text-[15px] text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">
                      Remember this device
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span className="font-label-md text-[13px] font-semibold">AI Engine Active</span>
                  </div>
                </div>
                {/* Submit Button */}
                <button
                  className={`w-full mt-2 py-4 px-6 rounded-xl ${
                    authState === 'authenticated' ? 'bg-secondary' : 'bg-primary-container hover:bg-primary'
                  } text-on-primary font-headline-sm text-[17px] font-bold flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(91,75,219,0.24)] hover:shadow-[0_8px_24px_rgba(91,75,219,0.34)] transition-all active:scale-[0.99]`}
                  disabled={authState !== 'idle'}
                  id="btn-submit"
                  type="submit"
                >
                  {authState === 'authenticating' && (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      <span>Authenticating...</span>
                    </>
                  )}
                  {authState === 'authenticated' && (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>Authenticated</span>
                    </>
                  )}
                  {authState === 'idle' && (
                    <>
                      <span className="">Sign In to Aralytics</span>
                      <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
              {/* Institutional Notice Banner */}
              <div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">verified_user</span>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-lg text-[15px] font-semibold text-on-surface">Institutional Credentials</span>
                    <p className="font-body-md text-[13.5px] leading-relaxed text-on-surface-variant">
                      Aralytics accounts are issued by your school administrator or teacher. Need access? Contact your school coordinator or activate an issued access key.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1.5">
                  <Link className="font-label-md text-[13.5px] text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 transition-colors font-semibold" to="/register">
                    <span className="">Activate issued account / key</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                  </Link>
                </div>
              </div>
            </div>
            {/* Security & Compliance Micro-Footer */}
            <div className="flex flex-col items-center text-center gap-1.5 mt-space-md">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-secondary">gshield</span>
                <span className="font-label-md text-[13px] font-medium">
                  Compliant with Philippine Data Privacy Act of 2012 (RA 10173)
                </span>
              </div>
              <span className="font-label-md text-[12.5px] text-outline">
                Encrypted TLS 1.3 • ISO 27001 Certified Learning Engine
              </span>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low/60 shadow-[0_-1px_8px_rgba(91,75,219,0.02)] py-space-lg">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="font-body-md text-[13.5px] text-on-surface-variant">
              © {CURRENT_YEAR} Aralytics Platform. Empowering learners and educators nationwide.
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <a className="font-label-md text-[13.5px] font-medium text-on-surface-variant hover:text-primary transition-colors" data-path="terms-of-service" href="#">
              Terms
            </a>
            <a className="font-label-md text-[13.5px] font-medium text-on-surface-variant hover:text-primary transition-colors" data-path="privacy-policy" href="#">
              Privacy Policy
            </a>
            <a className="font-label-md text-[13.5px] font-medium text-on-surface-variant hover:text-primary transition-colors" data-path="institution-portal" href="#">
              School Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
