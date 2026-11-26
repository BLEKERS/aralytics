import { Link } from 'react-router-dom'

/**
 * Canonical Aralytics brand lockup, matched to the public landing page:
 * primary rounded-square mark with the school glyph, amber status dot,
 * and the compact headline name.
 */
export default function BrandLogo({
  className = '',
  dotClassName = 'w-3.5 h-3.5',
  iconClassName = 'w-10 h-10',
  iconSize = 'text-[26px]',
  nameClassName = '',
  showName = true,
  to = '/',
}) {
  return (
    <Link
      aria-label="Aralytics home"
      className={`flex items-center gap-space-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-xl ${className}`}
      to={to}
    >
      <div
        className={`relative ${iconClassName} rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-[0_4px_16px_rgba(91,75,219,0.2)] transition-transform duration-200 group-hover:scale-105 shrink-0`}
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-tertiary-fixed ${iconSize} select-none`}>
          school
        </span>
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 -right-0.5 ${dotClassName} rounded-full bg-tertiary-fixed border-2 border-surface`}
        ></span>
      </div>
      {showName && (
        <span className={`font-headline-sm text-headline-sm tracking-tight text-on-surface leading-none ${nameClassName}`}>
          Aralytics
        </span>
      )}
    </Link>
  )
}
