import { useEffect, useState } from 'react'
import { IconCheck, IconTrophy } from '@tabler/icons-react'
import { useStore, usePlayerMap } from '../store'
import { useUi } from '../ui'
import { Sheet } from './Sheet'
import { Button } from './Button'

const QUICK_SCORES = ['6-0', '6-1', '6-2', '6-3', '6-4', '7-5', '7-6']

export function FinishSheet() {
  const id = useUi((s) => s.finishId)
  const close = () => useUi.getState().openFinish(null)
  const match = useStore((s) => s.matches.find((m) => m.id === id))
  const court = useStore((s) => s.courts.find((c) => c.id === match?.courtId))
  const autoAssign = useStore((s) => s.autoAssign)
  const finishMatch = useStore((s) => s.finishMatch)
  const players = usePlayerMap()
  const [winner, setWinner] = useState<string | null>(null)
  const [score, setScore] = useState('')

  useEffect(() => {
    setWinner(null)
    setScore('')
  }, [id])

  const open = !!match && match.status === 'live'

  const finish = () => {
    if (!match || !winner) return
    finishMatch(match.id, winner, score.trim() || undefined)
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={`Finish match · ${court?.name ?? ''}`}>
      {match && (
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-xs font-bold tracking-[0.01em] text-muted uppercase">Winner</div>
            <div className="grid grid-cols-2 gap-3">
              {[match.p1, match.p2].map((pid) => {
                const selected = winner === pid
                return (
                  <button
                    key={pid}
                    onClick={() => setWinner(pid)}
                    className={`btn h-24 flex-col gap-1.5 rounded-[20px]! px-3 text-base leading-tight transition-[background-color,color,box-shadow,transform] duration-200 ${
                      selected ? 'btn-primary' : 'btn-secondary'
                    }`}
                    aria-pressed={selected}
                  >
                    <IconTrophy
                      key={String(selected)}
                      size={22}
                      className={selected ? 'swap-in text-lime-bright' : 'text-subtle'}
                    />
                    <span className="line-clamp-2">{players.get(pid)?.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold tracking-[0.01em] text-muted uppercase" htmlFor="score">
              Score <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              id="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 6-4 3-6 10-8"
              className="mt-2 h-12 w-full rounded-2xl bg-white px-4 text-base text-ink-strong shadow-[inset_0_0_0_1px_var(--color-line-strong)] outline-none placeholder:text-subtle focus:shadow-[inset_0_0_0_2px_var(--color-primary)]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_SCORES.map((s) => (
                <button
                  key={s}
                  onClick={() => setScore((cur) => (cur ? `${cur} ${s}` : s))}
                  className="press rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-ink tabular-nums transition-colors hover:bg-lime-soft"
                >
                  {s}
                </button>
              ))}
              {score && (
                <button onClick={() => setScore('')} className="rounded-full px-3 py-1 text-sm font-bold text-primary">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <Button variant="primary" size="lg" className="w-full" disabled={!winner} onClick={finish}>
              <IconCheck size={20} stroke={2.5} /> Finish match
            </Button>
            {autoAssign && <p className="mt-2 text-center text-xs text-muted">Next match will be called to this court</p>}
          </div>
        </div>
      )}
    </Sheet>
  )
}
