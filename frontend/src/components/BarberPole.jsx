import { useId } from 'react'

// A barber pole whose stripes slowly roll. The motion is CSS-driven
// (.pole-roll in App.css) and switches off for reduced-motion users.
function BarberPole({ className = '' }) {
  const uid = useId().replace(/:/g, '')
  const clipId = `pole-clip-${uid}`
  const patternId = `pole-pattern-${uid}`

  return (
    <svg
      className={`barber-pole ${className}`.trim()}
      viewBox="0 0 160 360"
      role="img"
      aria-label="Barber pole"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="44" y="52" width="72" height="256" rx="36" />
        </clipPath>
        <pattern id={patternId} width="80" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect y="0" width="80" height="15" fill="#c8323c" />
          <rect y="15" width="80" height="15" fill="#ffffff" />
          <rect y="30" width="80" height="15" fill="#2c5aa0" />
          <rect y="45" width="80" height="15" fill="#ffffff" />
        </pattern>
      </defs>

      <rect className="pole-cap" x="72" y="10" width="16" height="18" rx="5" fill="#16202e" />
      <rect className="pole-cap" x="34" y="26" width="92" height="30" rx="8" fill="#16202e" />
      <rect className="pole-cap" x="34" y="304" width="92" height="30" rx="8" fill="#16202e" />
      <rect className="pole-cap" x="72" y="332" width="16" height="18" rx="5" fill="#16202e" />

      <g clipPath={`url(#${clipId})`}>
        <rect className="pole-roll" x="44" y="-40" width="72" height="420" fill={`url(#${patternId})`} />
      </g>

      <rect className="pole-outline" x="44" y="52" width="72" height="256" rx="36" fill="none" stroke="#16202e" strokeWidth="3" />
      <rect x="55" y="70" width="7" height="220" rx="3.5" fill="#ffffff" opacity="0.4" />
    </svg>
  )
}

export default BarberPole
