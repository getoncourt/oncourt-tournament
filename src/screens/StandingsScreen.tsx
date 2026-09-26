import { useStore } from '../store'

export function StandingsScreen() {
  const groups = useStore((s) => s.groups)
  const players = useStore((s) => s.players)
  const matches = useStore((s) => s.matches)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Standings</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((g) => {
          const gm = matches.filter((m) => m.groupId === g.id)
          const rows = players
            .filter((p) => p.groupId === g.id)
            .map((p) => {
              const mine = gm.filter((m) => m.status === 'done' && (m.p1 === p.id || m.p2 === p.id))
              const w = mine.filter((m) => m.winnerId === p.id).length
              return { p, w, l: mine.length - w, left: gm.filter((m) => m.status !== 'done' && (m.p1 === p.id || m.p2 === p.id)).length }
            })
            .sort((a, b) => b.w - a.w || a.l - b.l)
          const played = gm.filter((m) => m.status === 'done').length
          return (
            <div key={g.id} className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 text-white" style={{ background: g.color }}>
                <span className="text-lg font-bold">{g.name}</span>
                <span className="text-sm font-semibold opacity-90">
                  {played}/{gm.length} played
                </span>
              </div>
              <table className="w-full text-left">
                <thead className="text-xs tracking-wide text-ink/50 uppercase">
                  <tr>
                    <th className="w-10 py-2 pl-4">#</th>
                    <th>Player</th>
                    <th className="w-10 text-center">W</th>
                    <th className="w-10 text-center">L</th>
                    <th className="w-14 pr-4 text-center">Left</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.p.id} className="border-t-2 border-ink/5">
                      <td className="py-2 pl-4 font-bold text-ink/40">{i === 0 && r.w > 0 ? '👑' : i + 1}</td>
                      <td className="font-medium">{r.p.name}</td>
                      <td className="text-center font-bold text-court tabular-nums">{r.w}</td>
                      <td className="text-center text-clay tabular-nums">{r.l}</td>
                      <td className="pr-4 text-center text-ink/40 tabular-nums">{r.left}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
