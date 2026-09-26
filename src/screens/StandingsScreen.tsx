import { useState } from 'react'
import { useStore } from '../store'
import { fmtClock, fmtDur } from '../logic/time'
import type { Group, Match, Player } from '../types'

export function StandingsScreen() {
  const groups = useStore((s) => s.groups)
  const [sel, setSel] = useState<string | null>(null)
  const group = groups.find((g) => g.id === sel) ?? groups[0]

  if (!group) return <div className="mx-auto max-w-5xl text-ink/60">No groups yet.</div>

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Standings</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {groups.map((g) => {
          const active = g.id === group.id
          return (
            <button
              key={g.id}
              onClick={() => setSel(g.id)}
              className={`btn h-11 shrink-0 whitespace-nowrap ${active ? 'text-white' : 'bg-white'}`}
              style={active ? { background: g.color } : undefined}
            >
              {!active && <span className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: g.color }} />}
              {g.name}
            </button>
          )
        })}
      </div>
      <GroupDetail key={group.id} group={group} />
    </div>
  )
}

type Row = { p: Player; played: number; w: number; l: number; left: number }

function GroupDetail({ group }: { group: Group }) {
  const allPlayers = useStore((s) => s.players)
  const allMatches = useStore((s) => s.matches)
  const courts = useStore((s) => s.courts)
  const players = allPlayers.filter((p) => p.groupId === group.id)
  const gm = allMatches.filter((m) => m.groupId === group.id)
  const done = gm.filter((m) => m.status === 'done')
  const name = (id: string) => allPlayers.find((p) => p.id === id)?.name ?? '?'
  const courtName = (id?: string) => courts.find((c) => c.id === id)?.name ?? '–'

  const rows: Row[] = players
    .map((p) => {
      const mine = done.filter((m) => m.p1 === p.id || m.p2 === p.id)
      const w = mine.filter((m) => m.winnerId === p.id).length
      const left = gm.filter((m) => m.status !== 'done' && (m.p1 === p.id || m.p2 === p.id)).length
      return { p, played: mine.length, w, l: mine.length - w, left }
    })
    .sort((a, b) => b.w - a.w || a.l - b.l || a.p.name.localeCompare(b.p.name))

  const waits = done.filter((m) => m.calledAt && m.startedAt).map((m) => m.startedAt! - m.calledAt!)
  const durs = done.filter((m) => m.startedAt && m.finishedAt).map((m) => m.finishedAt! - m.startedAt!)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
  const pct = gm.length ? Math.round((done.length / gm.length) * 100) : 0

  // most recent first; then on-court; then upcoming in schedule order
  const history = [...done].sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
  const onCourt = gm.filter((m) => m.status === 'called' || m.status === 'live')
  const upcoming = gm.filter((m) => m.status === 'queued')

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Progress" value={`${done.length}/${gm.length}`}>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: group.color }} />
          </div>
        </Tile>
        <Tile label="On court" value={String(onCourt.length)} />
        <Tile label="Avg call → start" value={fmtDur(avg(waits))} />
        <Tile label="Avg match" value={fmtDur(avg(durs))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Table */}
        <div className="card overflow-hidden">
          <Header color={group.color}>Table</Header>
          <table className="w-full text-left">
            <thead className="text-xs tracking-wide text-ink/50 uppercase">
              <tr>
                <th className="w-10 py-2 pl-4">#</th>
                <th>Player</th>
                <th className="w-9 text-center">P</th>
                <th className="w-9 text-center">W</th>
                <th className="w-9 text-center">L</th>
                <th className="w-12 pr-4 text-center">Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.p.id} className="border-t-2 border-ink/5">
                  <td className="py-2 pl-4 font-bold text-ink/40">{i === 0 && r.w > 0 ? '👑' : i + 1}</td>
                  <td className="truncate font-medium">{r.p.name}</td>
                  <td className="text-center text-ink/60 tabular-nums">{r.played}</td>
                  <td className="text-center font-bold text-court tabular-nums">{r.w}</td>
                  <td className="text-center text-clay tabular-nums">{r.l}</td>
                  <td className="pr-4 text-center text-ink/40 tabular-nums">{r.left}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Head to head */}
        <div className="card overflow-hidden">
          <Header color={group.color}>Head to head</Header>
          <div className="overflow-x-auto p-3">
            <HeadToHead players={rows.map((r) => r.p)} matches={gm} />
          </div>
        </div>
      </div>

      {/* Match history */}
      <div className="card overflow-hidden">
        <Header color={group.color}>
          Match history <span className="font-medium opacity-80">· {done.length} played</span>
        </Header>
        <ul className="divide-y-2 divide-ink/5">
          {onCourt.map((m) => (
            <HistoryRow key={m.id} m={m} name={name} court={courtName(m.courtId)} />
          ))}
          {history.map((m) => (
            <HistoryRow key={m.id} m={m} name={name} court={courtName(m.courtId)} />
          ))}
          {!history.length && !onCourt.length && <li className="p-4 text-center text-ink/50">No matches played yet.</li>}
        </ul>
        {upcoming.length > 0 && (
          <details className="border-t-2 border-ink/10">
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-ink/60">
              {upcoming.length} upcoming
            </summary>
            <ul className="divide-y-2 divide-ink/5">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="w-9 font-bold text-ink/40">#{m.num}</span>
                  <span>
                    {name(m.p1)} <span className="text-ink/40">vs</span> {name(m.p2)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}

function Header({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-lg font-bold text-white" style={{ background: color }}>
      {children}
    </div>
  )
}

function Tile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] font-semibold tracking-wide text-ink/50 uppercase">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {children}
    </div>
  )
}

function HistoryRow({ m, name, court }: { m: Match; name: (id: string) => string; court: string }) {
  const done = m.status === 'done'
  const cls = (id: string) => (done ? (m.winnerId === id ? 'font-bold' : 'text-ink/45') : 'font-medium')
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <span className="w-9 font-bold text-ink/40">#{m.num}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate">
          <span className={cls(m.p1)}>
            {done && m.winnerId === m.p1 && '🏆 '}
            {name(m.p1)}
          </span>
          <span className="mx-1.5 text-xs font-bold text-ink/40">VS</span>
          <span className={cls(m.p2)}>
            {done && m.winnerId === m.p2 && '🏆 '}
            {name(m.p2)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-ink/55 tabular-nums">
          <span>{court}</span>
          {m.status === 'called' && <span className="font-semibold text-clay">📣 calling since {fmtClock(m.calledAt)}</span>}
          {m.status === 'live' && <span className="font-semibold text-court">● live since {fmtClock(m.startedAt)}</span>}
          {done && (
            <>
              <span>
                {fmtClock(m.startedAt)}–{fmtClock(m.finishedAt)}
              </span>
              <span title="Time from calling players to match start">📣 wait {fmtDur(m.calledAt && m.startedAt ? m.startedAt - m.calledAt : undefined)}</span>
              <span title="Match duration">⏱ {fmtDur(m.startedAt && m.finishedAt ? m.finishedAt - m.startedAt : undefined)}</span>
            </>
          )}
        </div>
      </div>
      {done && m.score && <span className="rounded-lg bg-ink/5 px-2 py-0.5 text-sm font-semibold tabular-nums">{m.score}</span>}
    </li>
  )
}

/** Round-robin grid: row player's result vs column player. */
function HeadToHead({ players, matches }: { players: Player[]; matches: Match[] }) {
  const find = (a: string, b: string) => matches.find((m) => (m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a))
  const initials = (n: string) =>
    n
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
  return (
    <table className="mx-auto border-separate border-spacing-1 text-center text-sm">
      <thead>
        <tr>
          <th />
          {players.map((p) => (
            <th key={p.id} className="w-11 font-semibold text-ink/60" title={p.name}>
              {initials(p.name)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((row) => (
          <tr key={row.id}>
            <th className="max-w-28 truncate pr-2 text-right font-medium">{row.name}</th>
            {players.map((col) => {
              if (row.id === col.id) return <td key={col.id} className="h-10 rounded-lg bg-ink/10" />
              const m = find(row.id, col.id)
              const won = m?.status === 'done' && m.winnerId === row.id
              const lost = m?.status === 'done' && m.winnerId !== row.id
              const cls = won
                ? 'bg-court text-white'
                : lost
                  ? 'bg-clay/80 text-white'
                  : m?.status === 'live' || m?.status === 'called'
                    ? 'bg-ball text-ink'
                    : 'bg-ink/5 text-ink/30'
              return (
                <td key={col.id} className={`h-10 rounded-lg font-bold ${cls}`} title={m?.score}>
                  {won ? 'W' : lost ? 'L' : m?.status === 'live' ? '●' : m?.status === 'called' ? '📣' : '·'}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
