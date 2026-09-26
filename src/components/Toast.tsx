import { useEffect } from 'react'
import { IconCircleCheck } from '@tabler/icons-react'
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
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 md:bottom-6">
      <div
        key={toast.id}
        className="enter pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink-strong py-2 pr-2 pl-4 text-sm text-white shadow-[0_4px_16px_rgba(0,0,0,.2)]"
      >
        <IconCircleCheck size={18} className="shrink-0 text-lime-bright" />
        <span className="font-bold">{toast.text}</span>
        {toast.undo ? (
          <button
            className="rounded-full px-3 py-1.5 font-bold text-lime-bright hover:bg-white/10"
            onClick={() => {
              toast.undo?.()
              dismiss()
            }}
          >
            Undo
          </button>
        ) : (
          <span className="w-2" />
        )}
      </div>
    </div>
  )
}
