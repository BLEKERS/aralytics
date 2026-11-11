import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { api, saveSession } from '../../api/client';
import { describeApiError } from '../../components/DataState';

const CURRENT_YEAR = new Date().getFullYear();

export default function AccountActivationScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialOrUpper = /[A-Z!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  let score = 0;
  if (password.length > 0) score++;
  if (hasLength) score++;
  if (hasLength && hasNumber) score++;
  if (hasLength && hasNumber && hasSpecialOrUpper) score++;

  let strengthLabelText = 'Minimum 8 chars & 1 number';
  let strengthLabelClass = 'font-label-md text-label-md text-outline';
  const barColors = [
    'bg-outline-variant',
    'bg-outline-variant',
    'bg-outline-variant',
    'bg-outline-variant',
  ];

  if (score === 1) {
    barColors[0] = 'bg-error';
    strengthLabelText = 'Too weak';
    strengthLabelClass = 'font-label-sm text-label-sm text-error font-medium';
  } else if (score === 2) {
    barColors[0] = 'bg-tertiary-fixed-dim';
    barColors[1] = 'bg-tertiary-fixed-dim';
    strengthLabelText = 'Moderate';
    strengthLabelClass = 'font-label-sm text-label-sm text-tertiary font-medium';
  } else if (score >= 3) {
    barColors[0] = 'bg-secondary';
    barColors[1] = 'bg-secondary';
    barColors[2] = 'bg-secondary';
    if (score === 4) {
      barColors[3] = 'bg-secondary';
      strengthLabelText = 'Strong & Secure';
    } else {
      strengthLabelText = 'Good';
    }
    strengthLabelClass = 'font-label-sm text-label-sm text-secondary font-medium';
  }

  const handleActivation = async (e) => {
    e.preventDefault();
    if (status !== 'idle') return;
    setError(null);

    if (!passwordsMatch) {
      setError(new Error('Passwords do not match. Re-enter both passwords.'));
      return;
    }

    setStatus('validating');
    try {
      const verified = await api.auth.verifyKey({
        institutionCode: institutionCode.trim(),
        accessKey: accessKey.trim(),
        role: role === 'student' ? 'STUDENT' : 'TEACHER',
      });
      const auth = await api.auth.activate({
        activationToken: verified.activationToken,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      saveSession(auth);
      setStatus('verified');
      navigate(auth.user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(err);
      setStatus('idle');
    }
  };

  const isStudent = role === 'student';

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setError(null);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col justify-between antialiased selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <header className="w-full bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.04)]">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin h-20 flex items-center justify-between">
          <BrandLogo to="/" />
          <div className="flex items-center gap-space-lg">
            <a className="flex items-center gap-space-xs font-label-lg text-body-md text-on-surface-variant hover:text-primary transition-colors font-medium" data-path="support" href="#">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="">Help &amp; Support</span>
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-margin-mobile md:px-margin py-space-xl flex items-center justify-center">
        <div className="flex flex-col w-full items-center justify-center py-space-sm sm:py-space-md">
          {/* Subtle decorative ambient backdrop elements strictly self-contained */}
          <div className="relative w-full max-w-[620px]">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-surface-container rounded-full blur-3xl opacity-60 pointer-events-none -z-10"></div>
            <div className="absolute -bottom-10 -right-8 w-72 h-72 bg-surface-variant/40 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
            {/* Main Activation Card Container */}
            <div
              className="w-full bg-surface-container-lowest rounded-xl sm:rounded-[24px] shadow-[0_12px_40px_rgba(91,75,219,0.08)] px-space-md sm:px-space-xl py-space-lg sm:py-space-xl"
              style={{
                boxShadow:
                  'rgba(91, 75, 219, 0.15) 0px 20px 40px -15px, rgba(21, 25, 54, 0.08) 0px 10px 25px -5px, rgba(15, 23, 42, 0.12) 0px 35px 60px -15px',
                border: '1px solid rgba(223, 224, 255, 0.8)',
              }}
            >
              {/* Top Badging & Headings */}
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-3 py-1.5 rounded-full mb-space-sm">
                  <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                  <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase">
                    Institutional Onboarding
                  </span>
                </div>
                <h1 className="font-display-lg text-[32px] leading-[1.2] sm:text-display-lg text-on-surface tracking-tight mb-space-xs text-balance">
                  Activate Your Account
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[500px] text-center mb-space-lg leading-relaxed">
                  Enter your school-issued registration key or credentials to link your academic profile with Aralytics.
                </p>
                {/* Segmented Role Selector */}
                <div className="w-full max-w-[420px] p-1 bg-surface-container-low rounded-xl flex items-center mb-space-lg">
                  <button
                    className={
                      isStudent
                        ? 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[16px] font-medium transition-all flex items-center justify-center gap-1.5 bg-surface-container-lowest text-primary shadow-[0_2px_8px_rgba(91,75,219,0.12)]'
                        : 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[16px] font-medium transition-all flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface'
                    }
                    id="role-student"
                    onClick={() => handleRoleChange('student')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">school</span>
                    <span className="">Student Activation</span>
                  </button>
                  <button
                    className={
                      !isStudent
                        ? 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[16px] font-medium transition-all flex items-center justify-center gap-1.5 bg-surface-container-lowest text-primary shadow-[0_2px_8px_rgba(91,75,219,0.12)]'
                        : 'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-[16px] font-medium transition-all flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface'
                    }
                    id="role-educator"
                    onClick={() => handleRoleChange('educator')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">co_present</span>
                    <span className="">Teacher / School Setup</span>
                  </button>
                </div>
              </div>
              {/* Activation Form */}
              <form className="space-y-space-md" id="activation-form" onSubmit={handleActivation}>
                {error && (
                  <div className="flex items-start gap-space-xs rounded-xl bg-error-container px-space-sm py-3 text-on-error-container" role="alert">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span className="font-body-md text-body-md">{describeApiError(error)}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm sm:gap-space-md">
                  <div>
                    <label className="block font-label-lg text-body-lg font-semibold text-on-surface mb-1.5" htmlFor="full-name">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">badge</span>
                      <input
                        className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all"
                        id="full-name"
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Juan Dela Cruz"
                        required
                        type="text"
                        value={fullName}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-lg text-body-lg font-semibold text-on-surface mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">mail</span>
                      <input
                        className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all"
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.edu.ph"
                        required
                        type="email"
                        value={email}
                      />
                    </div>
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-label-lg text-body-lg font-semibold text-on-surface" htmlFor="institution-code">
                      School or Institution Code
                    </label>
                    <span className="font-label-md text-label-md text-on-surface-variant">e.g. STJUDE-CS-2025</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">domain</span>
                    <input
                      className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all uppercase tracking-wider"
                      id="institution-code"
                      onChange={(e) => setInstitutionCode(e.target.value)}
                      placeholder="e.g. STJUDE-MNL-2025"
                      required
                      type="text"
                      value={institutionCode}
                    />
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-label-lg text-body-lg font-semibold text-on-surface" htmlFor="access-key" id="key-label">
                      {isStudent ? 'Access Key or Student ID' : 'Faculty PIN or Department Code'}
                    </label>
                    <span className="font-label-md text-label-md text-on-surface-variant" id="key-hint">
                      {isStudent ? 'Issued by Teacher/Adviser' : 'Issued by School Admin / Division'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">key</span>
                    <input
                      className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all uppercase tracking-wider"
                      id="access-key"
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder={isStudent ? 'KEY-8821-PY' : 'FAC-2025-DEPED'}
                      required
                      type="text"
                      value={accessKey}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm sm:gap-space-md pt-space-xs">
                  <div>
                    <label className="block font-label-lg text-body-lg font-semibold text-on-surface mb-1.5" htmlFor="password">
                      Set Your Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">lock</span>
                      <input
                        className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1"
                        onClick={() => setShowPassword((prev) => !prev)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]" id="toggle-icon-1">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-lg text-body-lg font-semibold text-on-surface mb-1.5" htmlFor="confirm-password">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[22px] pointer-events-none">lock_reset</span>
                      <input
                        className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-lg rounded-xl shadow-[0_1px_4px_rgba(91,75,219,0.04)] placeholder:text-outline-variant focus:outline-none focus:shadow-[0_0_0_3px_#e4dfff] transition-all"
                        id="confirm-password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                      />
                      <button
                        aria-label="Toggle confirm password visibility"
                        className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]" id="toggle-icon-2">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-lg text-on-surface-variant flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">shield</span>
                      Password Requirements:
                    </span>
                    <span className={strengthLabelClass} id="strength-label">
                      {strengthLabelText}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div className={`rounded-full h-full transition-colors duration-300 ${barColors[0]}`} id="bar-1"></div>
                    <div className={`rounded-full h-full transition-colors duration-300 ${barColors[1]}`} id="bar-2"></div>
                    <div className={`rounded-full h-full transition-colors duration-300 ${barColors[2]}`} id="bar-3"></div>
                    <div className={`rounded-full h-full transition-colors duration-300 ${barColors[3]}`} id="bar-4"></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant font-label-md text-label-md pt-0.5">
                    <span className={`flex items-center gap-1.5 ${hasLength ? 'text-secondary' : 'text-on-surface-variant'}`} id="req-length">
                      <span className={`material-symbols-outlined text-[16px] ${hasLength ? 'text-secondary' : 'text-outline'}`}>
                        {hasLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      8+ Characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-secondary' : 'text-on-surface-variant'}`} id="req-number">
                      <span className={`material-symbols-outlined text-[16px] ${hasNumber ? 'text-secondary' : 'text-outline'}`}>
                        {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      At least 1 Number
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-secondary' : 'text-on-surface-variant'}`} id="req-match">
                      <span className={`material-symbols-outlined text-[16px] ${passwordsMatch ? 'text-secondary' : 'text-outline'}`}>
                        {passwordsMatch ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Passwords match
                    </span>
                  </div>
                </div>
                <div className="pt-1">
                  <label className="flex items-start gap-space-sm cursor-pointer select-none">
                    <input
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary focus:ring-offset-0 transition cursor-pointer accent-primary"
                      id="privacy-consent"
                      required
                      type="checkbox"
                    />
                    <span className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      I agree to the{' '}
                      <a className="text-primary font-semibold hover:underline" data-path="terms" href="#">
                        Terms of Service
                      </a>{' '}
                      and acknowledge the institutional processing of educational data in compliance with the{' '}
                      <span className="text-on-surface font-medium">Philippine Data Privacy Act of 2012 (RA 10173)</span>.
                    </span>
                  </label>
                </div>
                <div className="pt-2">
                  <button
                    className={`w-full py-4 px-space-lg ${
                      status === 'verified' ? 'bg-secondary' : 'bg-primary-container hover:bg-primary'
                    } text-on-primary font-headline-sm text-[18px] rounded-xl shadow-[0_4px_16px_rgba(91,75,219,0.22)] hover:shadow-[0_8px_24px_rgba(91,75,219,0.30)] flex items-center justify-center gap-space-xs transition-all active:scale-[0.99]`}
                    disabled={status !== 'idle'}
                    id="submit-btn"
                    type="submit"
                  >
                    {status === 'validating' && (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        <span>Validating Institutional Key...</span>
                      </>
                    )}
                    {status === 'verified' && (
                      <>
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        <span>Key Verified! Redirecting...</span>
                      </>
                    )}
                    {status === 'idle' && (
                      <>
                        <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                        <span className="" id="btn-text">
                          {isStudent ? 'Complete Registration & Sign In' : 'Set Up Faculty Account'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
              {/* Institutional Pilot Notice Card */}
              <div className="mt-space-lg p-space-sm bg-surface-container rounded-xl flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container text-[20px]">corporate_fare</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-lg text-body-md text-on-surface font-semibold">
                      Representing a School or Division?
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      Deploy diagnostic AI models across your faculty.
                    </span>
                  </div>
                </div>
                <Link className="flex-shrink-0 font-label-lg text-body-md text-primary hover:text-on-primary-fixed-variant font-semibold flex items-center gap-0.5" data-path="pilot-inquiry" to="/#pilot-signup">
                  <span className="">Inquire</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
              {/* Footer Contextual Links */}
              <div className="mt-space-lg pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
                <div className="font-body-md text-body-md text-on-surface-variant">
                  Already activated your profile?{' '}
                  <Link className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5 ml-1" data-path="login" to="/login">
                    <span className="">Sign in</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
                <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium" data-path="activation-assistance" href="#">
                  <span className="material-symbols-outlined text-[18px]">contact_support</span>
                  <span className="">Lost Registration Key?</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low/60 shadow-[0_-1px_8px_rgba(91,75,219,0.02)] py-space-lg">
        <div className="max-w-[1120px] mx-auto px-margin-mobile md:px-margin flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="font-body-md text-body-md text-on-surface-variant">
              © {CURRENT_YEAR} Aralytics Platform. Empowering learners and educators nationwide.
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <a className="font-label-md text-body-md text-on-surface-variant hover:text-primary transition-colors" data-path="terms-of-service" href="#">
              Terms
            </a>
            <a className="font-label-md text-body-md text-on-surface-variant hover:text-primary transition-colors" data-path="privacy-policy" href="#">
              Privacy Policy
            </a>
            <a className="font-label-md text-body-md text-on-surface-variant hover:text-primary transition-colors" data-path="institution-portal" href="#">
              School Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
