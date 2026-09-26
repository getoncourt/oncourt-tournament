import { IconAlertTriangle, IconArrowsExchange, IconBallTennis, IconSpeakerphone } from '@tabler/icons-react'
import { useStore, usePlayerMap } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, freeCourts } from '../logic/courts'
import { Sheet } from './Sheet'
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
  const Icon = moving ? IconArrowsExchange : IconSpeakerphone

  return (
    <Sheet open={!!match} onClose={close} title={moving ? `Move from ${currentCourt?.name ?? 'court'}` : 'Call to court'}>
      {match && (
        <div className="space-y-4">
          <MatchCard match={match} />
          {blockers.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-mojo-soft/60 px-3 py-2.5 text-sm font-bold text-mojo">
              <IconAlertTriangle size={18} className="shrink-0" />
              {blockers.map((p) => players.get(p)?.name).join(' & ')} {blockers.length > 1 ? 'are' : 'is'} on court now
            </div>
          )}
          {free.length === 0 ? (
            <div className="rounded-[20px] bg-surface-muted p-6 text-center">
              <IconBallTennis size={32} className="mx-auto text-subtle" />
              <div className="mt-1 font-bold text-ink-strong">All courts busy</div>
              <div className="text-sm text-muted">Finish a match to free a court.</div>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold tracking-[0.01em] text-muted uppercase">Available courts</div>
              <div className="grid grid-cols-2 gap-3">
                {free.map((c) => (
                  <button
                    key={c.id}
                    disabled={blockers.length > 0}
                    className="btn btn-secondary h-18 flex-col gap-0.5 rounded-[20px]! hover:bg-primary-50"
                    onClick={() => {
                      if (moving) moveToCourt(match.id, c.id)
                      else callMatch(match.id, c.id)
                      close()
                    }}
                  >
                    <Icon size={18} className="text-primary" />
                    <span className="text-base text-ink-strong">{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {!moving && <p className="text-center text-xs text-muted">Players are called first. Start the match when both are ready.</p>}
        </div>
      )}
    </Sheet>
  )
}
