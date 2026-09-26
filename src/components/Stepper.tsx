type Props = { value: number; onChange: (n: number) => void; label: string; min?: number; max?: number }

export function Stepper({ value, onChange, label, min = 1, max = 12 }: Props) {
  const btn = 'btn h-10 w-10 bg-white p-0 text-xl'
  return (
    <div className="flex items-center gap-2">
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
        −
      </button>
      <div className="min-w-14 text-center leading-none">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-[11px] font-semibold tracking-wide text-ink/50 uppercase">{label}</div>
      </div>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  )
}
