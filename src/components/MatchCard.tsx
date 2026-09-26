import type { ReactNode } from 'react'
import type { Match } from '../types'
import { useGroupMap, usePlayerMap } from '../store'

type Props = {
  match: Match
  right?: ReactNode
  dim?: boolean
  note?: ReactNode
  className?: string
}

export function MatchCard({ match, right, dim, note, className = '' }: Props) {
  const players = usePlayerMap()
  const group = useGroupMap().get(match.groupId)
  const p1 = players.get(match.p1)?.name ?? '?'
  const p2 = players.get(match.p2)?.name ?? '?'
  const done = match.status === 'done'
  const win = (id: string) => (done && match.winnerId === id ? 'font-bold' : done ? 'text-ink/45' : '')

  return (
    <div className={`card flex items-stretch overflow-hidden ${dim ? 'opacity-55' : ''} ${className}`}>
      <div className="w-2 shrink-0" style={{ background: group?.color ?? '#999' }} />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/5 text-sm font-bold text-ink/70">
          #{match.num}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: group?.color }}>
            <span className="truncate">{group?.name ?? 'No group'}</span>
            {note && <span className="truncate text-ink/50">· {note}</span>}
          </div>
          <div className="truncate leading-tight">
            <span className={win(match.p1)}>{p1}</span>
            <span className="mx-1.5 text-xs font-bold text-ink/40">VS</span>
            <span className={win(match.p2)}>{p2}</span>
          </div>
          {done && match.score && <div className="text-xs text-ink/60 tabular-nums">{match.score}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}
