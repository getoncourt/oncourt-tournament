import type { ReactNode } from 'react'
import { IconArrowBackUp, IconArrowsExchange, IconChevronRight, IconPlayerPause } from '@tabler/icons-react'
import { useStore } from '../store'
import { useUi } from '../ui'
import { freeCourts } from '../logic/courts'
import { Sheet } from './Sheet'
import { MatchCard } from './MatchCard'

/** Fix mistakes on a court: move match, undo start, send back to queue. */
export function CourtActionsSheet() {
  const id = useUi((s) => s.actionsId)
  const close = () => useUi.getState().openActions(null)
  const matches = useStore((s) => s.matches)
  const courts = useStore((s) => s.courts)
  const unstart = useStore((s) => s.unstart)
  const cancelMatch = useStore((s) => s.cancelMatch)
  const match = matches.find((m) => m.id === id)
  const open = !!match && (match.status === 'called' || match.status === 'live')
  const court = courts.find((c) => c.id === match?.courtId)
  const canMove = freeCourts(courts, matches).length > 0

  const run = (fn: () => void) => () => {
    fn()
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={court?.name ?? 'Court'}>
      {match && (
        <div className="space-y-4">
          <MatchCard match={match} note={match.status === 'live' ? 'Live' : 'Calling players'} />
          <div className="card-sm divide-y divide-line overflow-hidden">
            <Row
              icon={<IconArrowsExchange size={20} />}
              title="Move court"
              sub={canMove ? 'Send to another free court' : 'No free court'}
              disabled={!canMove}
              onClick={() => {
                close()
                useUi.getState().openPlay(match.id)
              }}
            />
            {match.status === 'live' && (
              <Row icon={<IconPlayerPause size={20} />} title="Undo start" sub="Back to calling players" onClick={run(() => unstart(match.id))} />
            )}
            <Row
              icon={<IconArrowBackUp size={20} />}
              title="Back to queue"
              sub="Free this court, keep schedule position"
              onClick={run(() => cancelMatch(match.id))}
            />
          </div>
          <p className="text-center text-xs text-muted">Every action can be undone from the toast.</p>
        </div>
      )}
    </Sheet>
  )
}

function Row({ icon, title, sub, onClick, disabled }: { icon: ReactNode; title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-page disabled:opacity-40">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink-strong">{title}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      <IconChevronRight size={18} className="text-subtle" />
    </button>
  )
}
