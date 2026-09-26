import { useStore } from '../store'
import { useUi } from '../ui'
import { freeCourts } from '../logic/courts'
import { Sheet } from './Sheet'
import { Button } from './Button'
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
    <Sheet open={open} onClose={close} title={`${court?.name ?? 'Court'} options`}>
      {match && (
        <div className="space-y-3">
          <MatchCard match={match} note={match.status === 'live' ? 'playing' : 'calling players'} />
          <Button
            size="lg"
            className="w-full justify-start"
            disabled={!canMove}
            onClick={() => {
              close()
              useUi.getState().openPlay(match.id)
            }}
          >
            ⇄ Move to another court
            {!canMove && <span className="text-sm font-normal text-ink/50">(none free)</span>}
          </Button>
          {match.status === 'live' && (
            <Button size="lg" className="w-full justify-start" onClick={run(() => unstart(match.id))}>
              ⏸ Not started yet — back to calling
            </Button>
          )}
          <Button size="lg" className="w-full justify-start" onClick={run(() => cancelMatch(match.id))}>
            ↩ Take off court — back to queue
          </Button>
          <p className="text-center text-xs text-ink/50">Every action can be undone from the toast.</p>
        </div>
      )}
    </Sheet>
  )
}
