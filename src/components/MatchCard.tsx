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
  const win = (id: string) => (done && match.winnerId === id ? 'font-bold text-ink-strong' : done ? 'text-subtle' : 'font-bold text-ink-strong')

  return (
    <div className={`card-sm flex items-center gap-3 px-3 py-2.5 ${dim ? 'opacity-50' : ''} ${className}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-sm font-bold text-muted tabular-nums">
        {match.num}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs leading-4 font-bold">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: group?.color ?? '#999' }} />
          <span className="truncate text-muted">{group?.name ?? 'No group'}</span>
          {note && <span className="truncate font-bold text-muted">· {note}</span>}
        </div>
        <div className="truncate text-[15px] leading-6">
          <span className={win(match.p1)}>{p1}</span>
          <span className="mx-1.5 text-xs font-bold text-subtle">vs</span>
          <span className={win(match.p2)}>{p2}</span>
        </div>
        {done && match.score && <div className="text-xs text-muted tabular-nums">{match.score}</div>}
      </div>
      {right}
    </div>
  )
}
