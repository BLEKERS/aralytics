import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { getSession, logout } from '../../api/client';

const CURRENT_YEAR = new Date().getFullYear();

function formatRoleLabel(role) {
  if (role === 'TEACHER') return 'Teacher / Educator';
  if (role === 'STUDENT') return 'Student';
  return 'Guest';
}

export default function ForbiddenScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);

  const session = getSession();
  const currentRole = location.state?.currentRole || session?.user?.role || null;
  const requiredRole = location.state?.requiredRole || null;
  const requestedPath = location.state?.from || null;

  const isSignedIn = Boolean(session?.token);
  const dashboardPath = currentRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isSignedIn ? dashboardPath : '/', { replace: true });
    }
  };

  const handleSwitchAccount = async () => {
    if (switching) return;
    setSwitching(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-dvh flex flex-col justify-between antialiased selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <header className="w-full bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.04)] shrink-0">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin h-16 flex items-center">
          <BrandLogo to="/" />
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-[1120px] mx-auto px-margin-mobile md:px-margin py-4 sm:py-6 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[520px] relative">
          <div aria-hidden="true" className="absolute -top-10 -left-10 w-44 h-44 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          <div aria-hidden="true" className="absolute -bottom-8 -right-8 w-40 h-40 bg-secondary-container/30 rounded-full blur-2xl pointer-events-none"></div>

          <section
            aria-labelledby="forbidden-title"
            className="relative bg-surface-container-lowest rounded-[20px] sm:rounded-[24px] shadow-[0_20px_50px_-12px_rgba(24,20,68,0.16),0_8px_20px_-6px_rgba(91,75,219,0.12)] px-4 py-6 sm:px-8 sm:py-9 flex flex-col items-center text-center gap-3.5 sm:gap-4.5"
          >
            <div
              aria-hidden="true"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[20px] bg-error-container text-on-error-container flex items-center justify-center shadow-[0_6px_18px_rgba(186,26,26,0.12)]"
            >
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]">gpp_bad</span>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[12px] font-semibold tracking-wide">
              403 · Access Restricted
            </span>

            <div className="flex flex-col items-center gap-2">
              <h1
                className="font-display-lg text-[24px] sm:text-[32px] leading-[1.2] font-extrabold tracking-tight text-on-surface text-balance"
                id="forbidden-title"
              >
                You don&apos;t have access to this page
              </h1>
              <p className="font-body-md text-[14px] sm:text-[15px] leading-relaxed text-on-surface-variant max-w-[410px]">
                {requiredRole ? (
                  <>
                    Your current account (<strong>{formatRoleLabel(currentRole)}</strong>) does not have
                    permission to open this area. It requires a{' '}
                    <strong>{formatRoleLabel(requiredRole)}</strong> role.
                  </>
                ) : (
                  'Your current account does not have permission to view this page.'
                )}
              </p>
            </div>

            {(requestedPath || requiredRole) && (
              <div
                aria-label="Access details"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl px-3.5 py-3 sm:px-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2 text-left"
              >
                <div className="min-w-0">
                  <span className="block font-label-sm text-[11px] font-semibold tracking-wider uppercase text-outline mb-0.5">
                    Requested Route
                  </span>
                  <strong className="block font-label-md text-[13px] font-semibold text-on-surface truncate">
                    {requestedPath || '/forbidden'}
                  </strong>
                </div>
                <div className="min-w-0">
                  <span className="block font-label-sm text-[11px] font-semibold tracking-wider uppercase text-outline mb-0.5">
                    Your Role
                  </span>
                  <strong className="block font-label-md text-[13px] font-semibold text-on-surface truncate">
                    {currentRole || 'GUEST'}
                  </strong>
                </div>
                <div className="min-w-0">
                  <span className="block font-label-sm text-[11px] font-semibold tracking-wider uppercase text-outline mb-0.5">
                    Required Role
                  </span>
                  <strong className="block font-label-md text-[13px] font-semibold text-on-surface truncate">
                    {requiredRole || 'AUTHORIZED'}
                  </strong>
                </div>
              </div>
            )}

            <div className="w-full flex flex-col gap-2.5 mt-0.5">
              <Link
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary font-label-lg text-[15px] font-semibold shadow-[0_8px_22px_-4px_rgba(91,75,219,0.34)] hover:shadow-[0_10px_26px_-4px_rgba(91,75,219,0.44)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                to={isSignedIn ? dashboardPath : '/login'}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                  {isSignedIn ? 'dashboard' : 'login'}
                </span>
                <span>{isSignedIn ? 'Go to My Dashboard' : 'Sign In'}</span>
              </Link>

              <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                <button
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] bg-surface-container-low hover:bg-primary-fixed text-on-primary-fixed-variant border border-outline-variant/45 font-label-md text-[14px] font-semibold transition-colors cursor-pointer"
                  onClick={handleGoBack}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    arrow_back
                  </span>
                  <span>Go Back</span>
                </button>

                {isSignedIn ? (
                  <button
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] bg-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-md text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                    disabled={switching}
                    onClick={handleSwitchAccount}
                    type="button"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      swap_horiz
                    </span>
                    <span>{switching ? 'Signing out...' : 'Switch Account'}</span>
                  </button>
                ) : (
                  <Link
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] bg-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-md text-[14px] font-semibold transition-colors"
                    to="/"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      home
                    </span>
                    <span>Back to Home</span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full bg-surface-container-low/60 py-3.5 px-4 shrink-0">
        <div className="max-w-[1120px] mx-auto flex items-center justify-center text-center">
          <span className="font-body-md text-[13px] leading-snug text-on-surface-variant">
            &copy; {CURRENT_YEAR} Aralytics Platform. Role-Based Access Control Active.
          </span>
        </div>
      </footer>
    </div>
  );
}
