import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
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
  const cancelMatch = useStore((s) => s.cancelMatch)
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
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#d7f205', '#1f7a4a', '#e2703a', '#ffffff'] })
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={<>Finish {court?.name ?? 'match'} <span className="text-ink/40">#{match?.num}</span></>}>
      {match && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-ink/60">Who won?</div>
          <div className="grid grid-cols-2 gap-3">
            {[match.p1, match.p2].map((pid) => {
              const selected = winner === pid
              return (
                <button
                  key={pid}
                  onClick={() => setWinner(pid)}
                  className={`btn h-24 flex-col gap-1 text-lg leading-tight ${selected ? 'bg-ball' : 'bg-white'}`}
                >
                  <span className="text-2xl">{selected ? '🏆' : '🎾'}</span>
                  <span className="line-clamp-2">{players.get(pid)?.name}</span>
                </button>
              )
            })}
          </div>

          <div>
            <label className="text-sm font-semibold text-ink/60" htmlFor="score">
              Score <span className="font-normal">(optional)</span>
            </label>
            <input
              id="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 6-4 3-6 10-8"
              className="mt-1 h-12 w-full rounded-2xl border-[3px] border-ink bg-white px-4 text-lg outline-none focus:bg-ball/20"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_SCORES.map((s) => (
                <button
                  key={s}
                  onClick={() => setScore((cur) => (cur ? `${cur} ${s}` : s))}
                  className="rounded-lg bg-ink/5 px-2.5 py-1 text-sm font-medium tabular-nums hover:bg-ink/10"
                >
                  {s}
                </button>
              ))}
              {score && (
                <button onClick={() => setScore('')} className="rounded-lg px-2.5 py-1 text-sm text-clay-dark">
                  clear
                </button>
              )}
            </div>
          </div>

          <Button variant="ball" size="lg" className="w-full" disabled={!winner} onClick={finish}>
            ✓ Finish match
          </Button>
          {autoAssign && <p className="-mt-2 text-center text-xs text-ink/50">Next match will auto-start on this court</p>}
          <button
            className="w-full py-1 text-sm font-medium text-ink/50 underline-offset-2 hover:underline"
            onClick={() => {
              cancelMatch(match.id)
              close()
            }}
          >
            Stop & send back to queue
          </button>
        </div>
      )}
    </Sheet>
  )
}
