type Props = { checked: boolean; onChange: (v: boolean) => void; label: string }

/** DS ToggleSwitch. */
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm font-bold text-ink">
      <span className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-line-strong'}`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  )
}
