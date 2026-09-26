import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconCircleCheck } from '@tabler/icons-react'
import { useStore } from '../store'

const OUT = [0.23, 1, 0.32, 1] as const

export function Toast() {
  const toast = useStore((s) => s.toast)
  const dismiss = useStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismiss, 4500)
    return () => clearTimeout(t)
  }, [toast, dismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex h-12 justify-center px-4 md:bottom-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, transform: 'translateY(24px) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(12px) scale(0.96)', transition: { duration: 0.16 } }}
            transition={{ duration: 0.28, ease: OUT }}
            className="pointer-events-auto absolute flex items-center gap-2.5 rounded-full bg-ink-strong py-2 pr-2 pl-3 text-sm text-white shadow-[0_8px_24px_rgba(4,32,31,.28)]"
          >
            <motion.span
              initial={{ transform: 'scale(0.5) rotate(-45deg)', opacity: 0 }}
              animate={{ transform: 'scale(1) rotate(0deg)', opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.3, ease: OUT }}
              className="grid h-6 w-6 place-items-center rounded-full bg-lime-bright text-primary-900"
            >
              <IconCircleCheck size={16} stroke={2.5} />
            </motion.span>
            <span className="font-bold whitespace-nowrap">{toast.text}</span>
            {toast.undo ? (
              <button
                className="press rounded-full bg-white/10 px-3 py-1.5 font-bold text-lime-bright hover:bg-white/20"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
