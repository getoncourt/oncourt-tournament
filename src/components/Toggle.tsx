type Props = { checked: boolean; onChange: (v: boolean) => void; label: string }

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-semibold"
    >
      <span
        className={`relative h-8 w-14 rounded-full border-[3px] border-ink transition-colors ${checked ? 'bg-court' : 'bg-ink/15'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full border-[3px] border-ink bg-ball transition-all ${checked ? 'left-[26px]' : 'left-0.5'}`}
        />
      </span>
      {label}
    </button>
  )
}
