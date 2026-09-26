import { useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { IconBallTennis, IconChartBar, IconClock, IconCrown, IconSpeakerphone, IconTrophy } from '@tabler/icons-react'
import { PageHero } from '../components/PageHero'
import { Num } from '../components/Num'
import { useStore } from '../store'
import { fmtClock, fmtDur } from '../logic/time'
import type { Group, Match, Player } from '../types'

export function StandingsScreen() {
  const groups = useStore((s) => s.groups)
  const [sel, setSel] = useState<string | null>(null)
  const group = groups.find((g) => g.id === sel) ?? groups[0]

  if (!group) return <div className="mx-auto max-w-5xl text-muted">No groups yet.</div>

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHero title="Standings" sub={`${groups.length} groups`} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {groups.map((g) => {
          const active = g.id === group.id
          return (
            <button
              key={g.id}
              onClick={() => setSel(g.id)}
              className={`btn btn-secondary relative h-9 shrink-0 px-4 text-sm whitespace-nowrap ${active ? 'text-white!' : ''}`}
            >
              {active && (
                <motion.span
                  layoutId="standings-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: g.color, boxShadow: `0 4px 0 0 color-mix(in srgb, ${g.color} 65%, black)` }}
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                />
              )}
              <span className="relative h-2 w-2 rounded-full ring-2 ring-white/70" style={{ background: g.color }} />
              <span className="relative">{g.name}</span>
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
  const courtName = (id?: string) => courts.find((c) => c.id === id)?.name ?? '-'

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
        <Tile i={0} label="Progress" value={`${done.length}/${gm.length}`} icon={<IconChartBar size={16} />} tone="bg-lime-soft text-lime-ink">
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full origin-left rounded-full bg-lime transition-transform duration-700 ease-[var(--ease-out)]"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
        </Tile>
        <Tile i={1} label="On court" value={String(onCourt.length)} icon={<IconBallTennis size={16} />} tone="bg-yellow-soft text-yellow-ink" />
        <Tile i={2} label="Avg wait" value={fmtDur(avg(waits))} icon={<IconSpeakerphone size={16} />} tone="bg-blue-soft text-blue" />
        <Tile i={3} label="Avg match" value={fmtDur(avg(durs))} icon={<IconClock size={16} />} tone="bg-indigo-soft text-indigo" />
      </div>

      <div className="enter grid gap-4 lg:grid-cols-2" style={{ '--i': 4 } as CSSProperties}>
        {/* Table */}
        <div className="card overflow-hidden">
          <Header color={group.color}>Table</Header>
          <table className="w-full text-left">
            <thead className="bg-surface-muted text-xs font-bold tracking-[0.01em] text-muted uppercase">
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
                <tr key={r.p.id} className="enter border-t border-line" style={{ '--i': i + 5 } as CSSProperties}>
                  <td className="py-2.5 pl-4 font-bold text-subtle tabular-nums">{i === 0 && r.w > 0 ? <IconCrown size={18} className="text-lime-ink" /> : i + 1}</td>
                  <td className="truncate font-bold text-ink-strong">{r.p.name}</td>
                  <td className="text-center text-muted tabular-nums">{r.played}</td>
                  <td className="text-center font-bold text-primary tabular-nums">{r.w}</td>
                  <td className="text-center text-mojo tabular-nums">{r.l}</td>
                  <td className="pr-4 text-center text-subtle tabular-nums">{r.left}</td>
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
          Match history <span className="font-normal opacity-80">· {done.length} played</span>
        </Header>
        <ul className="divide-y divide-line">
          {onCourt.map((m) => (
            <HistoryRow key={m.id} m={m} name={name} court={courtName(m.courtId)} />
          ))}
          {history.map((m) => (
            <HistoryRow key={m.id} m={m} name={name} court={courtName(m.courtId)} />
          ))}
          {!history.length && !onCourt.length && <li className="p-4 text-center text-sm text-muted">No matches played yet.</li>}
        </ul>
        {upcoming.length > 0 && (
          <details className="border-t border-line">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
              {upcoming.length} upcoming
            </summary>
            <ul className="divide-y divide-line">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="w-9 font-bold text-subtle">#{m.num}</span>
                  <span className="text-ink">
                    {name(m.p1)} <span className="text-subtle">vs</span> {name(m.p2)}
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
    <div
      className="flex items-center gap-2 px-4 py-2.5 text-base font-bold text-white"
      style={{ background: color }}
    >
      {children}
    </div>
  )
}

function Tile({
  label,
  value,
  icon,
  tone,
  i,
  children,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: string
  i: number
  children?: ReactNode
}) {
  return (
    <div className="card enter px-4 py-3" style={{ '--i': i } as CSSProperties}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold tracking-[0.01em] text-muted uppercase">{label}</div>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span>
      </div>
      <div className="overflow-hidden text-2xl leading-8 font-black text-ink-strong">
        <Num value={value} />
      </div>
      {children}
    </div>
  )
}

function HistoryRow({ m, name, court }: { m: Match; name: (id: string) => string; court: string }) {
  const done = m.status === 'done'
  const cls = (id: string) => (done ? (m.winnerId === id ? 'font-bold text-ink-strong' : 'text-subtle') : 'font-bold text-ink-strong')
  return (
    <li className="enter flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition-colors hover:bg-page">
      <span className="w-9 font-bold text-subtle">#{m.num}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate">
          <span className={cls(m.p1)}>
            {done && m.winnerId === m.p1 && <IconTrophy size={15} className="mr-1 inline -translate-y-px text-lime-ink" />}
            {name(m.p1)}
          </span>
          <span className="mx-1.5 text-xs font-bold text-subtle">vs</span>
          <span className={cls(m.p2)}>
            {done && m.winnerId === m.p2 && <IconTrophy size={15} className="mr-1 inline -translate-y-px text-lime-ink" />}
            {name(m.p2)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted tabular-nums">
          <span>{court}</span>
          {m.status === 'called' && <span className="tag bg-warning text-ink-strong">Calling since {fmtClock(m.calledAt)}</span>}
          {m.status === 'live' && <span className="tag bg-lime-soft text-lime-900">Live since {fmtClock(m.startedAt)}</span>}
          {done && (
            <>
              <span>
                {fmtClock(m.startedAt)} - {fmtClock(m.finishedAt)}
              </span>
              <span className="flex items-center gap-1" title="Time from calling players to match start"><IconSpeakerphone size={13} /> Wait {fmtDur(m.calledAt && m.startedAt ? m.startedAt - m.calledAt : undefined)}</span>
              <span className="flex items-center gap-1" title="Match duration"><IconClock size={13} /> {fmtDur(m.startedAt && m.finishedAt ? m.finishedAt - m.startedAt : undefined)}</span>
            </>
          )}
        </div>
      </div>
      {done && m.score && <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-sm font-bold text-ink-strong tabular-nums">{m.score}</span>}
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
            <th key={p.id} className="w-11 text-xs font-bold text-muted" title={p.name}>
              {initials(p.name)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((row, ri) => (
          <tr key={row.id}>
            <th className="max-w-28 truncate pr-2 text-right font-bold text-ink-strong">{row.name}</th>
            {players.map((col, ci) => {
              if (row.id === col.id) return <td key={col.id} className="h-10 rounded-lg bg-line" />
              const m = find(row.id, col.id)
              const won = m?.status === 'done' && m.winnerId === row.id
              const lost = m?.status === 'done' && m.winnerId !== row.id
              const cls = won
                ? 'bg-lime-soft text-lime-900'
                : lost
                  ? 'bg-mojo-soft text-mojo'
                  : m?.status === 'live' || m?.status === 'called'
                    ? 'bg-primary-100 text-primary'
                    : 'bg-surface-muted text-subtle'
              return (
                <td
                  key={col.id}
                  className={`swap-in h-10 rounded-lg font-bold ${cls}`}
                  style={{ animationDelay: `${(ri + ci) * 35}ms` }}
                  title={m?.score}
                >
                  {won ? 'W' : lost ? 'L' : m?.status === 'live' ? 'Live' : m?.status === 'called' ? <IconSpeakerphone size={14} className="mx-auto" /> : '·'}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
