import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { IconX } from '@tabler/icons-react'

type Props = { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }

const DRAWER = [0.32, 0.72, 0, 1] as const
const OUT = [0.23, 1, 0.32, 1] as const

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = matchMedia('(min-width: 768px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

/** Bottom sheet on mobile (drawer curve), centered dialog on desktop. Animates in and out. */
export function Sheet({ open, onClose, title, children }: Props) {
  const desktop = useIsDesktop()
  const reduce = useReducedMotion()
  // keep last content while the exit animation plays (callers often clear their data on close)
  const last = useRef({ title, children })
  if (open) last.current = { title, children }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const panel = desktop || reduce
    ? { initial: { opacity: 0, transform: 'scale(0.96)' }, animate: { opacity: 1, transform: 'scale(1)' }, exit: { opacity: 0, transform: 'scale(0.97)', transition: { duration: 0.15, ease: OUT } } }
    : { initial: { transform: 'translateY(100%)' }, animate: { transform: 'translateY(0%)' }, exit: { transform: 'translateY(100%)', transition: { duration: 0.22, ease: OUT } } }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-primary-900/50 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.22 }}
          />
          <motion.div
            {...panel}
            transition={{ duration: desktop ? 0.22 : 0.34, ease: desktop ? OUT : DRAWER }}
            className="pb-safe relative max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-4px_24px_rgba(4,32,31,.18)] md:max-w-md md:rounded-[28px]"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong md:hidden" />
            <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 md:pt-5">
              <h2 className="text-lg leading-6 font-bold text-ink-strong">{last.current.title}</h2>
              <button
                onClick={onClose}
                className="press grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-muted hover:bg-line"
                aria-label="Close"
              >
                <IconX size={18} stroke={2} />
              </button>
            </div>
            <div className="px-5 pb-6">{last.current.children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
