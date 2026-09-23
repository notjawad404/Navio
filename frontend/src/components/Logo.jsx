export function LogoMark({ size = 30, inverted = false, className = '' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[30%] shadow-sm ${
        inverted ? 'bg-white shadow-black/10' : 'bg-indigo-600 shadow-indigo-600/35'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.2 20 20.4a.7.7 0 0 1-.97.88L12 17.6l-7.03 3.68A.7.7 0 0 1 4 20.4Z"
          fill={inverted ? '#4f46e5' : '#fff'}
        />
        <path
          d="M12 3.2 12 17.6l-7.03 3.68A.7.7 0 0 1 4 20.4Z"
          fill={inverted ? '#a5b4fc' : '#c7c2f7'}
        />
      </svg>
    </span>
  )
}

export default function Logo({ size = 30, textClassName = 'text-xl', className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-display font-bold tracking-tight text-indigo-950 ${textClassName}`}>Navio</span>
    </span>
  )
}
