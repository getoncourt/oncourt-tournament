import { IconMinus, IconPlus } from '@tabler/icons-react'
import { Num } from './Num'

type Props = { value: number; onChange: (n: number) => void; label: string; min?: number; max?: number }

/** DS NumberCounter: round lifted icon buttons around a value. */
export function Stepper({ value, onChange, label, min = 1, max = 12 }: Props) {
  const btn = 'btn btn-secondary h-9 w-9 p-0! px-0'
  return (
    <div className="flex items-center gap-2">
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
        <IconMinus size={16} stroke={2.5} />
      </button>
      <div className="min-w-12 text-center leading-none">
        <div className="overflow-hidden text-xl font-black text-ink-strong">
          <Num value={value} />
        </div>
        <div className="mt-0.5 text-[10px] leading-[14px] font-bold tracking-[0.01em] text-muted uppercase">{label}</div>
      </div>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        <IconPlus size={16} stroke={2.5} />
      </button>
    </div>
  )
}
