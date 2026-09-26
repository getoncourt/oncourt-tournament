import { useStore, usePlayerMap } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, freeCourts } from '../logic/courts'
import { Sheet } from './Sheet'
import { Button } from './Button'
import { MatchCard } from './MatchCard'

/** Pick a free court for a queued match. Only free courts are offered. */
export function PlaySheet() {
  const id = useUi((s) => s.playId)
  const close = () => useUi.getState().openPlay(null)
  const matches = useStore((s) => s.matches)
  const courts = useStore((s) => s.courts)
  const startMatch = useStore((s) => s.startMatch)
  const showToast = useStore((s) => s.showToast)
  const players = usePlayerMap()
  const match = matches.find((m) => m.id === id)
  const free = freeCourts(courts, matches)
  const busy = busyPlayerIds(matches)
  const onCourt = match ? [match.p1, match.p2].filter((p) => busy.has(p)) : []

  return (
    <Sheet open={!!match} onClose={close} title="Start match on…">
      {match && (
        <div className="space-y-4">
          <MatchCard match={match} />
          {onCourt.length > 0 && (
            <div className="rounded-xl bg-clay/15 px-3 py-2 text-sm font-medium text-clay-dark">
              ⚠️ {onCourt.map((p) => players.get(p)?.name).join(' & ')} {onCourt.length > 1 ? 'are' : 'is'} playing right now
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
                  disabled={onCourt.length > 0}
                  onClick={() => {
                    startMatch(match.id, c.id)
                    showToast(`Match #${match.num} started on ${c.name}`)
                    close()
                  }}
                >
                  <span className="text-xs font-medium opacity-80">▶ Play on</span>
                  {c.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
