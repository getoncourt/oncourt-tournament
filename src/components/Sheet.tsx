import { useEffect, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }

/** Bottom sheet on mobile, centered dialog on desktop. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="fade-in absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="sheet-in pb-safe relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-[3px] border-b-0 border-ink bg-mist md:max-w-md md:rounded-3xl md:border-b-[3px]">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ink/20 md:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 md:pt-5">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-2xl leading-none hover:bg-ink/10" aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}
