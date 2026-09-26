/** Number that ticks (slide + blur) whenever its value changes. */
export function Num({ value, className = '' }: { value: number | string; className?: string }) {
  return (
    <span key={value} className={`tick tabular-nums ${className}`}>
      {value}
    </span>
  )
}
