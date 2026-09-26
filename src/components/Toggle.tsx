type Props = { checked: boolean; onChange: (v: boolean) => void; label: string }

/** DS ToggleSwitch. Knob moves with transform (GPU) on a strong ease-out. */
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="press flex items-center gap-2 text-sm font-bold text-ink">
      <span
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-line-strong'}`}
      >
        <span
          className="absolute top-0.5 left-0.5 grid h-6 w-6 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-250 ease-[var(--ease-out)]"
          style={{ transform: `translateX(${checked ? 20 : 0}px)` }}
        >
          <span className={`h-2 w-2 rounded-full transition-[background-color,transform] duration-200 ${checked ? 'scale-100 bg-lime' : 'scale-50 bg-line-strong'}`} />
        </span>
      </span>
      {label}
    </button>
  )
}
