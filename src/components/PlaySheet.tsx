import { useStore, usePlayerMap } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, freeCourts } from '../logic/courts'
import { Sheet } from './Sheet'
import { Button } from './Button'
import { MatchCard } from './MatchCard'

/**
 * Pick a free court. Queued match → call it to that court.
 * Match already on court → move it there. Only free courts are offered.
 */
export function PlaySheet() {
  const id = useUi((s) => s.playId)
  const close = () => useUi.getState().openPlay(null)
  const matches = useStore((s) => s.matches)
  const courts = useStore((s) => s.courts)
  const callMatch = useStore((s) => s.callMatch)
  const moveToCourt = useStore((s) => s.moveToCourt)
  const players = usePlayerMap()
  const match = matches.find((m) => m.id === id)
  const moving = !!match && match.status !== 'queued'
  const free = freeCourts(courts, matches)
  const busy = busyPlayerIds(matches)
  const blockers = match && !moving ? [match.p1, match.p2].filter((p) => busy.has(p)) : []
  const currentCourt = courts.find((c) => c.id === match?.courtId)

  return (
    <Sheet open={!!match} onClose={close} title={moving ? `Move from ${currentCourt?.name ?? 'court'} to…` : 'Send to court…'}>
      {match && (
        <div className="space-y-4">
          <MatchCard match={match} />
          {blockers.length > 0 && (
            <div className="rounded-xl bg-clay/15 px-3 py-2 text-sm font-medium text-clay-dark">
              ⚠️ {blockers.map((p) => players.get(p)?.name).join(' & ')} {blockers.length > 1 ? 'are' : 'is'} on court right now
            </div>
          )}
          {free.length === 0 ? (
            <div className="rounded-2xl border-[3px] border-dashed border-ink/25 p-6 text-center">
              <div className="text-3xl">🎾</div>
              <div className="font-semibold">All courts busy</div>
              <div className="text-sm text-ink/60">Finish a match to free a court.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {free.map((c) => (
                <Button
                  key={c.id}
                  variant="court"
                  size="lg"
                  className="h-20! flex-col gap-0!"
                  disabled={blockers.length > 0}
                  onClick={() => {
                    if (moving) moveToCourt(match.id, c.id)
                    else callMatch(match.id, c.id)
                    close()
                  }}
                >
                  <span className="text-xs font-medium opacity-80">{moving ? '⇄ Move to' : '📣 Call to'}</span>
                  {c.name}
                </Button>
              ))}
            </div>
          )}
          {!moving && <p className="text-center text-xs text-ink/50">Match starts when you tap ▶ Play on the court.</p>}
        </div>
      )}
    </Sheet>
  )
}
