import { useEffect } from 'react'
import { useStore } from '../store'

export function Toast() {
  const toast = useStore((s) => s.toast)
  const dismiss = useStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismiss, 4500)
    return () => clearTimeout(t)
  }, [toast, dismiss])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6">
      <div key={toast.id} className="pop pointer-events-auto flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-ink py-2 pr-2 pl-4 text-white shadow-lg">
        <span className="font-medium">{toast.text}</span>
        {toast.undo && (
          <button
            className="rounded-xl bg-ball px-3 py-1.5 font-semibold text-ink"
            onClick={() => {
              toast.undo?.()
              dismiss()
            }}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}
