import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { api } from '../../api/client';
import { describeApiError } from '../../components/DataState';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [productTab, setProductTab] = useState('students');
  const [pilotEmail, setPilotEmail] = useState('');
  const [pilotState, setPilotState] = useState('idle');
  const [pilotError, setPilotError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePilotSubmit = async (event) => {
    event.preventDefault();
    if (pilotState === 'sending') return;
    setPilotState('sending');
    setPilotError(null);
    try {
      await api.public.pilotInquiry({ email: pilotEmail });
      setPilotState('success');
      setPilotEmail('');
    } catch (error) {
      setPilotState('error');
      setPilotError(describeApiError(error)?.message || error.message);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(91,75,219,0.06)]">
        <div className="h-20 max-w-[1120px] mx-auto px-margin-mobile lg:px-margin flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <BrandLogo to="/" />
            <nav className="hidden lg:flex items-center gap-1" data-active-classes="bg-surface-container-high text-primary font-label-lg rounded-xl">
              <a className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg" data-path="features" href="#">Features</a>
              <a className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg" data-path="for-students" href="#">For Students</a>
              <a className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg" data-path="for-teachers" href="#">For Teachers</a>
              <a className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg" data-path="curriculum" href="#">Curriculum &amp; Topics</a>
              <a className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg" data-path="pricing-pilot" href="#pilot-signup">Pricing&nbsp;&nbsp;</a>
            </nav>
            <button
              aria-expanded={menuOpen}
              aria-label="Open navigation menu"
              className="lg:hidden w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-space-sm lg:gap-space-md">
            <div className="flex items-center bg-surface-container-low p-1 rounded-full text-on-surface-variant font-label-sm text-label-sm"></div>
            <Link className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors" data-path="login" to="/login">Log In</Link>
            <a className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_4px_16px_rgba(91,75,219,0.18)] hover:bg-primary-container hover:text-on-primary-container transition-all focus:outline-none focus:ring-4 focus:ring-primary-fixed" data-path="pricing-pilot" href="#pilot-signup">Start Free Classroom Pilot</a>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="lg:hidden border-t border-surface-container-high bg-surface/95 backdrop-blur-xl px-margin-mobile py-space-md flex flex-col gap-1">
            <a
              className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold"
              data-path="pricing-pilot"
              href="#pilot-signup"
              onClick={() => setMenuOpen(false)}
            >
              Start Free Classroom Pilot
            </a>
            <Link
              className="flex items-center px-3 py-2.5 rounded-xl text-on-surface hover:bg-surface-container transition-colors font-label-lg text-label-lg"
              data-path="login"
              onClick={() => setMenuOpen(false)}
              to="/login"
            >
              Log In
            </Link>
            {[
              { label: 'Features', path: 'features', href: '#' },
              { label: 'For Students', path: 'for-students', href: '#' },
              { label: 'For Teachers', path: 'for-teachers', href: '#' },
              { label: 'Curriculum & Topics', path: 'curriculum', href: '#' },
              { label: 'Pricing  ', path: 'pricing-pilot', href: '#pilot-signup' },
            ].map((item) => (
              <a
                className="flex items-center px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-lg text-label-lg"
                data-path={item.path}
                href={item.href}
                key={item.path}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>
      <main className="w-full pt-20 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* HERO SECTION */}
          <section className="relative w-full overflow-hidden pb-24 lg:pb-32 pt-8 lg:pt-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[980px] h-[480px] bg-gradient-to-br from-primary-fixed/30 via-tertiary-fixed/20 to-transparent blur-3xl opacity-40 rounded-full"></div>
            <div className="relative max-w-[1120px] mx-auto px-margin-mobile lg:px-margin flex flex-col items-center">
              <div className="inline-flex items-center gap-space-xs px-4 py-1.5 rounded-full bg-surface-container/60 mb-8 cursor-default transition-all hover:bg-surface-container">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-label-md text-label-md text-primary font-semibold tracking-wide">
                  AI Coding Diagnostics · Instant Personalized Feedback
                </span>
              </div>
              <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface text-center max-w-4xl tracking-tight leading-tight mb-6">
                Personalized AI Tutoring &amp; Instant Diagnostic Feedback for <span className="text-primary relative inline-block">Every Student Coder.</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-2xl mb-10 leading-relaxed">
                Aralytics empowers Computer Science teachers to spot programming misconceptions in seconds and guides student coders with instant, empathetic step-by-step AI feedback on Python, loops, and logic errors.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
                <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all" href="#pilot-signup">
                  <span className="">Launch Free School Pilot</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </a>
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-6 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg border border-surface-container-high/60 shadow-xs hover:bg-surface-container-low transition-all" onClick={() => setDemoOpen(true)} type="button">
                  <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </span>
                  <span className="">Watch 2-Min Classroom Demo</span>
                </button>
              </div>
              <div className="w-full max-w-2xl py-2.5 px-4 rounded-full bg-surface-container-low/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center mb-16">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Trusted by <strong className="text-on-surface font-semibold">60+ partner schools &amp; coding academies</strong> in the Philippines
                  </span>
                </div>
                <span className="text-outline-variant hidden sm:inline">•</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                  <span className=""><strong className="text-on-surface font-semibold">120,000+</strong> code exercises analyzed</span>
                </span>
              </div>
              <div className="w-full rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-[0_8px_32px_rgba(91,75,219,0.06)] border border-surface-container-high/50 relative">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-surface-container-high/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Intro to Python · Section CS-101 Diagnostic</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant">Module 3: For-Loops &amp; Indexing</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-between bg-surface-container-low/40 p-6 rounded-xl border border-surface-container-high/40">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-primary font-label-sm text-label-sm font-bold tracking-wide uppercase">Question 4 of 5 · Scenario</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">timer</span> 38s avg speed
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                        Predict the output and identify any runtime issue:
                      </h2>
                      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 text-left my-3 font-mono text-xs">
                        <p className="text-on-surface-variant mb-1"># Iterate through student grades</p>
                        <p className="text-primary font-semibold">grades = [88, 92, 79, 95]</p>
                        <p className="text-primary font-semibold">for i in range(len(grades) + 1):</p>
                        <p className="text-primary font-semibold pl-4">print(grades[i])</p>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                        <em>Hint:</em> Check zero-based indexing boundaries in Python lists.
                      </p>
                      <div className="space-y-2.5">
                        <div className="w-full p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex items-center justify-between opacity-50">
                          <span className="font-body-md text-body-md text-on-surface">A) Prints 88, 92, 79, 95 then terminates</span>
                          <span className="text-xs text-on-surface-variant">Normal loop</span>
                        </div>
                        <div className="w-full p-3.5 rounded-xl bg-surface-container-lowest border-2 border-primary flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">✓</span>
                            <span className="font-body-md text-body-md font-semibold text-primary">B) Prints all 4 grades then throws IndexError</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">Submitted</span>
                        </div>
                        <div className="w-full p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex items-center justify-between opacity-50">
                          <span className="font-body-md text-body-md text-on-surface">C) SyntaxError on line 3</span>
                          <span className="text-xs text-on-surface-variant">Syntax</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-6 border-t border-surface-container-high/50 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                      <span className="">Miguel Santos (Grade 10)</span>
                      <span className="opacity-75">Student ID: CS-2024-884</span>
                    </div>
                  </div>
                  <div className="lg:col-span-6 flex flex-col justify-between bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high/60">
                    <div>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-surface-container-high/40">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                          </div>
                          <div>
                            <div className="font-label-lg text-label-lg text-on-surface font-bold">Aral Coach AI</div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Real-time code diagnostic feedback</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">🔥 5-Day Coding Streak</span>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-low/50 mb-5">
                        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                          “Spot-on diagnostic, Miguel! You noticed that <code>len(grades)</code> is 4, but valid indices are only <code>0 to 3</code>. When the loop reaches index 4, Python raises an <strong>IndexError: list index out of range</strong>. To fix off-by-one loops, simply write <code>range(len(grades))</code> or iterate directly with <code>for grade in grades:</code>.”
                        </p>
                      </div>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-container-low/40 text-on-surface font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                          <span className=""><strong>Mastered:</strong> List Off-by-One Boundaries &amp; Index Errors</span>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-container-low/40 text-on-surface font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                          <span className=""><strong>Next Step:</strong> Nested list iteration and 2D arrays</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-surface-container-high/50 flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Topic Mastery: <strong>92%</strong></span>
                      <Link className="px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5" to="/student/quiz">
                        <span className="">Next Coding Drill</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* KEY VALUE PILLARS (3-Column Grid) */}
          <section className="w-full py-24 bg-surface-container-low/30">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Why Aralytics for Coding
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-3">
                  Built to fix coding roadblocks before students give up.
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
                  CS classrooms are full of silent frustration. Aralytics provides immediate AI feedback and automated triage so teachers can rescue struggling coders instantly.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-xs border border-surface-container-high/50 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed/60 flex items-center justify-center text-primary mb-6">
                      <span className="material-symbols-outlined text-[24px]">bolt</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">
                      Instant AI Diagnostic Feedback
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Within 5 seconds of code submission, students receive tailored diagnostic explanations identifying syntax bugs, logic errors, and variable scope mistakes without spoiling solutions.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-surface-container-high/40 flex items-center gap-2 text-primary font-label-sm text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span className="">Eliminates debugger anxiety</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-xs border border-surface-container-high/50 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary mb-6">
                      <span className="material-symbols-outlined text-[24px]">dashboard_customize</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">
                      Teacher Remedial Triage
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Live cluster view flags students stuck on loops, conditions, or recursion. Teachers can immediately dispatch focused remedial exercises or pair students with peer tutors.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-surface-container-high/40 flex items-center gap-2 text-secondary font-label-sm text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span className="">Instant lab section visibility</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-xs border border-surface-container-high/50 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/60 flex items-center justify-center text-tertiary mb-6">
                      <span className="material-symbols-outlined text-[24px]">quiz</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">
                      Scenario &amp; Logic Assessments
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Assess deep conceptual programming understanding with scenario questions, trace tables, and bug-hunting drills aligned to fundamental computing standards.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-surface-container-high/40 flex items-center gap-2 text-tertiary font-label-sm text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span className="">Deep conceptual mastery</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* DUAL-TAB PRODUCT PREVIEW ('For Students' vs 'For Teachers') */}
          <section className="w-full py-24 lg:py-32">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="flex flex-col items-center text-center mb-14">
                <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Two Perspectives · One Seamless Loop
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-3">
                  Explore the Aralytics Ecosystem
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3 leading-relaxed">
                  Toggle between the gamified, low-pressure learner feed and the command center built for DepEd Master Teachers.
                </p>
                <div className="mt-8 inline-flex p-1 rounded-full bg-surface-container-high/50 border border-surface-container-high/60">
                  <button className={`px-6 py-2 rounded-full ${productTab === 'students' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'} font-label-lg text-label-lg font-semibold transition-all flex items-center gap-2`} id="tab-btn-students" onClick={() => setProductTab('students')} type="button">
                    <span className="material-symbols-outlined text-[18px]">backpack</span>
                    <span className="">Student Experience</span>
                  </button>
                  <button className={`px-6 py-2 rounded-full ${productTab === 'teachers' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'} font-label-lg text-label-lg font-semibold transition-all flex items-center gap-2`} id="tab-btn-teachers" onClick={() => setProductTab('teachers')} type="button">
                    <span className="material-symbols-outlined text-[18px]">co_present</span>
                    <span className="">Teacher &amp; Adviser Hub</span>
                  </button>
                </div>
              </div>
              <div className={`rounded-2xl bg-surface-container-lowest p-8 lg:p-10 border border-surface-container-high/50 shadow-xs transition-all ${productTab === 'students' ? '' : 'hidden'}`} id="tab-content-students">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      <span className="">Interactive Code Companion</span>
                    </div>
                    <h3 className="font-headline-lg text-headline-md text-on-surface">
                      Daily 8-minute micro-drills that turn coding intimidation into mastery.
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Beginner coders often hesitate to ask questions during lab. Aral Coach gives friendly step-by-step guidance in English and Taglish, breaking down error logs into clear mental models.
                    </p>
                    <ul className="space-y-3.5 font-body-md text-body-md text-on-surface">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                        <span className=""><strong>Line-by-Line Diagnostics:</strong> Immediate explanations for SyntaxError, TypeError, and logic flaws.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                        <span className=""><strong>Gamified Mastery Streaks:</strong> 5-minute drills for functions, loops, lists, and OOP concepts.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                        <span className=""><strong>Low-Bandwidth Web &amp; Mobile:</strong> Complete offline syntax reviews, sync when connected.</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <Link className="inline-flex items-center gap-2 text-primary font-label-lg text-label-lg font-bold hover:underline" to="/student/dashboard">
                        <span className="">Preview Student Coding App</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                  <div className="lg:col-span-7 bg-surface-container-low/40 rounded-xl p-6 border border-surface-container-high/40">
                    <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/50 space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm">
                            MS
                          </div>
                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-bold leading-none">Kumusta, Miguel!</h4>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Grade 10 · Python &amp; Algorithms</span>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">⚡ 450 XP</span>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-primary font-label-sm text-label-sm font-semibold uppercase tracking-wider">Today&apos;s Coding Focus</span>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface mt-1">Python List Comprehension &amp; Loops</h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">5 diagnostic coding challenges · 7 mins</p>
                        </div>
                        <Link className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container shrink-0" to="/student/dashboard">
                          Simulan Na →
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="p-3.5 rounded-xl bg-surface-container-low/40 text-center">
                          <span className="font-headline-md text-secondary font-bold">96%</span>
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">For-Loops</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-surface-container-low/40 text-center">
                          <span className="font-headline-md text-primary font-bold">88%</span>
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Functions</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-surface-container-low/40 text-center">
                          <span className="font-headline-md text-on-surface-variant font-bold">78%</span>
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Recursion</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`rounded-2xl bg-surface-container-lowest p-8 lg:p-10 border border-surface-container-high/50 shadow-xs transition-all ${productTab === 'teachers' ? 'block' : 'hidden'}`} id="tab-content-teachers">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      <span className="">CS Teacher Command Center</span>
                    </div>
                    <h3 className="font-headline-lg text-headline-md text-on-surface">
                      Identify students stuck on syntax or logic before project deadlines.
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Instead of running around crowded computer labs, Aralytics aggregates code misconceptions in real time. Group students by error patterns and push automated remedial drills in two clicks.
                    </p>
                    <ul className="space-y-3.5 font-body-md text-body-md text-on-surface">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">analytics</span>
                        <span className=""><strong>Real-Time Lab Triage:</strong> Detect students facing repeated IndexError or infinite loops.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">download_done</span>
                        <span className=""><strong>Automated Mastery Reports:</strong> Export objective skill benchmarks for every student.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">sms</span>
                        <span className=""><strong>Targeted Remedial Exercises:</strong> Push auto-generated 3-item debugging drills.</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <Link className="inline-flex items-center gap-2 text-primary font-label-lg text-label-lg font-bold hover:underline" to="/teacher/dashboard">
                        <span className="">Request Teacher CS Sandbox</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                  <div className="lg:col-span-7 bg-surface-container-low/40 rounded-xl p-6 border border-surface-container-high/40">
                    <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/50 space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/50">
                        <div>
                          <h4 className="font-label-lg text-label-lg text-on-surface font-bold">Section CS-101 · Python Programming</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Instructor: Mr. Ronald Reyes · 38 Enrolled</span>
                        </div>
                        <Link className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center gap-1.5" to="/teacher/dashboard">
                          <span className="material-symbols-outlined text-[14px]">send</span> Push Drill
                        </Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-sm text-body-sm">
                          <thead>
                            <tr className="text-on-surface-variant border-b border-surface-container-high/60">
                              <th className="pb-2.5 font-semibold">Student Name</th>
                              <th className="pb-2.5 font-semibold">Topic: Loops</th>
                              <th className="pb-2.5 font-semibold">Status</th>
                              <th className="pb-2.5 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high/30">
                            <tr>
                              <td className="py-3 font-medium text-on-surface">Miguel Santos</td>
                              <td className="py-3 text-secondary font-semibold">92%</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Mastered</span></td>
                              <td className="py-3 text-right"><span className="text-primary hover:underline cursor-pointer font-semibold text-xs">Challenge Drill</span></td>
                            </tr>
                            <tr>
                              <td className="py-3 font-medium text-on-surface">Patricia Lim</td>
                              <td className="py-3 text-on-surface-variant font-semibold">65%</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">Needs Nudge</span></td>
                              <td className="py-3 text-right"><span className="text-primary hover:underline cursor-pointer font-semibold text-xs">Send Loop Hint</span></td>
                            </tr>
                            <tr>
                              <td className="py-3 font-medium text-on-surface">Kevin Bautista</td>
                              <td className="py-3 text-error font-semibold">40%</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded bg-error-container/60 text-error font-label-sm text-label-sm font-semibold">IndexError Trap</span></td>
                              <td className="py-3 text-right"><span className="text-error hover:underline cursor-pointer font-semibold text-xs">1-on-1 Debug</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-4 border-t border-surface-container-high/50 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                        <span className="">31 Mastered · 5 Nudge · 2 Urgent Debug</span>
                        <span className="text-secondary font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check</span> Lab Triage Live
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* DEPED K-12 MATATAG CURRICULUM ALIGNMENT */}
          <section className="w-full py-24 bg-surface-container-low/20">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 order-2 lg:order-1">
                  <div className="rounded-2xl bg-surface-container-lowest p-6 border border-surface-container-high/50 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                      <span className="font-headline-sm text-headline-sm text-on-surface">Coding Competencies Covered</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Core Computer Science</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-surface-container-low/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-[20px]">code</span>
                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Python Fundamentals</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Variables, Data Types, Conditionals, Loops</span>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Mapped</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container-low/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary text-[20px]">account_tree</span>
                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Data Structures &amp; Lists</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Zero-indexing, Slicing, Dictionaries, Sets</span>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Mapped</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container-low/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">bug_report</span>
                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Debugging &amp; Exception Handling</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">IndexError, TypeError, Tracebacks, Logic Bugs</span>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Mapped</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container-low/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">terminal</span>
                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Algorithmic Thinking</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Sorting, Searching, Nested Iteration</span>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Mapped</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                      <span className="">Compatible with school computer lab Chromebooks and student laptops.</span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                  <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                    Pedagogy-First AI Architecture
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    Engineered specifically for computer science educators.
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    Unlike generic chatbots that provide complete code copy-pastes, Aralytics uses Socratic hints and diagnostic questions that encourage students to reason through their logic errors independently.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface text-base mb-1.5">Socratic Hinting Engine</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Pinpoints syntax and logic errors line by line without giving away the direct answer.</p>
                    </div>
                    <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface text-base mb-1.5">Bilingual Taglish NLP Support</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Explains complex computer science concepts in conversational, approachable language.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* TESTIMONIALS & CLASSROOM IMPACT STORIES */}
          <section className="w-full py-24 lg:py-32">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Voices from the Coding Lab
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-3">
                  Loved by computer science teachers and student coders.
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
                  Real stories of debugging breakthroughs, reduced grading fatigue, and newfound coding confidence.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="rounded-2xl bg-surface-container-lowest p-8 border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-6">
                      “Dati tuwing lab hours, ang haba ng pila sa desk ko dahil sa simpleng IndexError o indentation issues. With Aralytics, students diagnose their own bugs within seconds, and I can focus on helping them design real algorithms.”
                    </p>
                  </div>
                  <div className="pt-5 border-t border-surface-container-high/40 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                      RR
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Mr. Ronald Reyes</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">CS &amp; Robotics Instructor, Ateneo HS</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-8 border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-6">
                      “I used to get so stressed seeing red error tracebacks in terminal. Aral Coach explains off-by-one errors step by step like a patient friend in Taglish. Coding isn&apos;t intimidating anymore.”
                    </p>
                  </div>
                  <div className="pt-5 border-t border-surface-container-high/40 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/50 text-secondary font-bold flex items-center justify-center shrink-0 text-sm">
                      MS
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Miguel Santos</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Grade 10 Student &amp; Aspiring Developer</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-8 border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-6">
                      “Our student retention in elective programming jumped significantly this semester. Students don&apos;t drop out because Aralytics catches misconceptions before they compound into failed projects.”
                    </p>
                  </div>
                  <div className="pt-5 border-t border-surface-container-high/40 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary font-bold flex items-center justify-center shrink-0 text-sm">
                      CL
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Claire Lim</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Tech Education Director, Metro Manila</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* METRICS CALLOUT STRIP (Warm Indigo/Yellow Accent Band) */}
          <section className="w-full py-12 bg-primary text-on-primary shadow-inner">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-lg text-center divide-y md:divide-y-0 md:divide-x divide-primary-fixed/20">
                <div className="p-4 flex flex-col items-center">
                  <span className="font-metric-number text-metric-number text-tertiary-fixed font-black tracking-tight leading-none">
                    &lt;5s
                  </span>
                  <span className="font-label-lg text-label-lg text-on-primary-container font-semibold mt-2">
                    Diagnostic AI Response
                  </span>
                  <span className="font-body-sm text-body-sm text-on-primary-container/80 mt-0.5">
                    Immediate error feedback
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center pt-6 md:pt-4">
                  <span className="font-metric-number text-metric-number text-secondary-fixed font-black tracking-tight leading-none">
                    94.2%
                  </span>
                  <span className="font-label-lg text-label-lg text-on-primary-container font-semibold mt-2">
                    Exercise Completion Rate
                  </span>
                  <span className="font-body-sm text-body-sm text-on-primary-container/80 mt-0.5">
                    Across pilot coding classes
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center pt-6 md:pt-4">
                  <span className="font-metric-number text-metric-number text-tertiary-fixed font-black tracking-tight leading-none">
                    10+ Hours
                  </span>
                  <span className="font-label-lg text-label-lg text-on-primary-container font-semibold mt-2">
                    Saved Per Teacher / Week
                  </span>
                  <span className="font-body-sm text-body-sm text-on-primary-container/80 mt-0.5">
                    Automated code triage &amp; grading
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center pt-6 md:pt-4">
                  <span className="font-metric-number text-metric-number text-on-primary font-black tracking-tight leading-none">
                    100%
                  </span>
                  <span className="font-label-lg text-label-lg text-on-primary-container font-semibold mt-2">
                    Pedagogical Integrity
                  </span>
                  <span className="font-body-sm text-body-sm text-on-primary-container/80 mt-0.5">
                    Socratic hints without answer leaks
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* FINAL CONVERSION & PILOT SIGNUP CTA SECTION */}
          <section className="w-full py-24 bg-surface-container-low/30" id="pilot-signup">
            <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
              <div className="rounded-3xl bg-surface-container-lowest p-10 lg:p-16 border border-surface-container-high/60 shadow-sm text-center max-w-3xl mx-auto space-y-6">
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[28px]">terminal</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg sm:text-[36px] text-on-surface font-bold tracking-tight leading-tight">
                  Ready to transform coding education in your school?
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                  Join over 60 schools and coding educators pioneering diagnostic-first computer science learning. <strong>Free 60-day pilot program for schools and coding academies.</strong>
                </p>
                <form className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto pt-4" onSubmit={handlePilotSubmit}>
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <input className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/60 focus:ring-2 focus:ring-primary text-on-surface font-body-md text-body-md shadow-xs outline-none transition-all placeholder:text-outline" placeholder="Enter your school or educator email..." required type="email" value={pilotEmail} onChange={(event) => setPilotEmail(event.target.value)} />
                  </div>
                  <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all whitespace-nowrap shrink-0 disabled:opacity-60" type="submit" disabled={pilotState === 'sending'}>
                    {pilotState === 'sending' ? 'Sending...' : 'Request Coding Pilot'}
                  </button>
                </form>
                {pilotState === 'success' && (
                  <div className="p-4 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md" id="pilot-success-msg">
                    🎉 Salamat! Our academic onboarding coordinator will email you within 24 hours with your coding lab sandbox credentials.
                  </div>
                )}
                {pilotState === 'error' && (
                  <div className="p-4 rounded-xl bg-error-container/50 border border-error/20 text-error font-label-md text-label-md" role="alert">
                    {pilotError || 'We could not send your request. Please try again.'}
                  </div>
                )}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    Data Privacy Act Certified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    Instant LMS &amp; Classroom Setup
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* DEMO VIDEO / INTERACTIVE SIMULATION MODAL */}
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm ${demoOpen ? 'flex' : 'hidden'}`} id="demo-modal">
            <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[24px] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">2-Minute Classroom Walkthrough</span>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors" onClick={() => setDemoOpen(false)} type="button">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              {/* Video Placeholder Container */}
              <div className="w-full aspect-video rounded-xl bg-surface-container-high relative overflow-hidden flex flex-col items-center justify-center text-center p-6">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center" data-alt="A bright high school classroom in the Philippines where an energetic Filipino teacher in formal DepEd uniform assists smiling Grade 8 students with tablet computers running diagnostic quizzes with colorful animated illustrations, soft warm natural sunlight" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuByAQQyWkiR8GmHKMaeGMXcq90qiOv15v4SHzx-saXMEsQTWJ5LSYKpRI9OG-5mZjpEI-C4RKBkfnydgmZknTsNg6MGxDBU5jOETzgrM4Mu-6DB_KOJg5aXAF4-cYmE2Rk64IfG8eD_TqQpkWYWTbebm6dOUBWNAskZNCfOyHoyOClPv_ca-knaAXWiSSl2LDaTkSQvM_La4j3NPEjaLOlzK-O4Anb9Qpw6iAr9wqMS92BW2RuAEpm0BQ')" }}></div>
                <div className="absolute inset-0 bg-primary/60 backdrop-blur-xs"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-lg mb-3">
                    <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-primary font-bold">Watch: How Mr. Reyes Runs an Interactive Python Lab with Aralytics</span>
                  <span className="font-label-sm text-label-sm text-on-primary-container mt-1">Tagalog &amp; English Audio · 2:14 mins</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Includes MATATAG SF9 grading demo</span>
                <button className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-highest" onClick={() => setDemoOpen(false)} type="button">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low text-on-surface-variant pt-space-xl pb-space-lg shadow-[0_-1px_12px_rgba(91,75,219,0.03)]">
        <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-space-lg pb-space-xl">
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-space-sm pr-space-lg">
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">AI-powered diagnostic and feedback platform for computer science education, debugging mastery, and personalized coding guidance.</p>
              <div className="mt-space-sm inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-sm text-label-sm w-fit">
                <span className="material-symbols-outlined text-tertiary text-[18px]">favorite</span><span className="">Empowering the next generation of Filipino software builders</span>
              </div>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Institutional</span>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="school-districts" href="#">School Partners</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="coding-academies" href="#">Coding Academies</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="pricing-pilot" href="#pilot-signup">School Pilot Program</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="cs-benchmarks" href="#">Skill Benchmarks</a>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Educators &amp; Youth</span>
              <Link className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="for-teachers" to="/teacher/dashboard">CS Teacher Hub</Link>
              <Link className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="for-students" to="/student/dashboard">Student Coding Feed</Link>
              <Link className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="exercises" to="/student/quiz">Python Exercises</Link>
              <Link className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="debug-lab" to="/student/quiz">Debugging Lab</Link>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Compliance &amp; Trust</span>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="privacy-policy" href="#">Data Privacy Act 2012</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="terms-of-service" href="#">Terms of Service</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="security-standards" href="#">Student Code Security</a>
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors" data-path="pedagogy-ethics" href="#">AI Pedagogy Standards</a>
            </div>
          </div>
          <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <p className="">© {CURRENT_YEAR} Aralytics EdTech Philippines Inc. All rights reserved.</p>
            <div className="flex items-center gap-space-md">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> Coding Lab LMS Ready</span>
              <span className="">Manila, Philippines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
