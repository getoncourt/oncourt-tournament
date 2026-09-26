import { useEffect, useState } from 'react'
import { useStore } from './store'
import { CourtsScreen } from './screens/CourtsScreen'
import { ScheduleScreen } from './screens/ScheduleScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { StandingsScreen } from './screens/StandingsScreen'
import { PlaySheet } from './components/PlaySheet'
import { FinishSheet } from './components/FinishSheet'
import { Toast } from './components/Toast'

type Tab = 'courts' | 'schedule' | 'players' | 'standings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'courts', label: 'Courts', icon: '🎾' },
  { id: 'schedule', label: 'Schedule', icon: '📋' },
  { id: 'players', label: 'Players', icon: '👥' },
  { id: 'standings', label: 'Standings', icon: '🏆' },
]

const readTab = (): Tab => {
  const h = location.hash.slice(1)
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'courts'
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(readTab)
  const liveCount = useStore((s) => s.matches.filter((m) => m.status === 'live').length)
  const queuedCount = useStore((s) => s.matches.filter((m) => m.status === 'queued').length)
  const resetDemo = useStore((s) => s.resetDemo)
  const clearAll = useStore((s) => s.clearAll)

  useEffect(() => {
    const onHash = () => setTabState(readTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const setTab = (t: Tab) => {
    location.hash = t
    setTabState(t)
    window.scrollTo({ top: 0 })
  }

  const badge = (t: Tab) => (t === 'courts' ? liveCount : t === 'schedule' ? queuedCount : 0)

  return (
    <div className="min-h-full md:flex">
      {/* Desktop rail */}
      <nav className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-2 border-r-[3px] border-ink bg-court p-4 text-white md:flex">
        <Logo />
        <div className="mt-4 flex flex-col gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn h-12 justify-start ${tab === t.id ? 'bg-ball text-ink' : 'bg-court-dark text-white'}`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="flex-1 text-left">{t.label}</span>
              {badge(t.id) > 0 && <Badge n={badge(t.id)} active={tab === t.id} />}
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-1 text-sm">
          <ResetButtons resetDemo={resetDemo} clearAll={clearAll} />
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b-[3px] border-ink bg-court px-4 py-2.5 text-white md:hidden">
          <Logo />
          <details className="relative">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl bg-court-dark text-xl">⋯</summary>
            <div className="absolute right-0 mt-2 w-44 space-y-1 rounded-2xl border-[3px] border-ink bg-white p-2 text-ink shadow-lg">
              <ResetButtons resetDemo={resetDemo} clearAll={clearAll} />
            </div>
          </details>
        </header>

        <main className="px-4 pt-4 pb-28 md:p-6 md:pb-10">
          {tab === 'courts' && <CourtsScreen goSchedule={() => setTab('schedule')} />}
          {tab === 'schedule' && <ScheduleScreen />}
          {tab === 'players' && <PlayersScreen goSchedule={() => setTab('schedule')} />}
          {tab === 'standings' && <StandingsScreen />}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-white md:hidden">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                tab === t.id ? 'text-court' : 'text-ink/50'
              }`}
            >
              <span className={`text-2xl transition-transform ${tab === t.id ? 'scale-125 -translate-y-0.5' : ''}`}>{t.icon}</span>
              {t.label}
              {badge(t.id) > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-3">
                  <Badge n={badge(t.id)} active />
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <PlaySheet />
      <FinishSheet />
      <Toast />
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink bg-ball text-lg">🎾</span>
      <span className="text-lg leading-none font-bold">
        OnCourt
        <br />
        <span className="text-sm font-medium opacity-80">Tournament</span>
      </span>
    </div>
  )
}

function Badge({ n, active }: { n: number; active: boolean }) {
  return (
    <span className={`rounded-full px-1.5 text-xs leading-5 font-bold tabular-nums ${active ? 'bg-clay text-white' : 'bg-white/20'}`}>
      {n}
    </span>
  )
}

function ResetButtons({ resetDemo, clearAll }: { resetDemo: () => void; clearAll: () => void }) {
  const cls = 'block w-full rounded-lg px-2 py-1.5 text-left font-medium opacity-80 hover:bg-black/10 hover:opacity-100'
  return (
    <>
      <button className={cls} onClick={() => confirm('Reset to demo data?') && resetDemo()}>
        ↺ Reset demo
      </button>
      <button className={cls} onClick={() => confirm('Clear everything and start blank?') && clearAll()}>
        🗑 Start blank
      </button>
    </>
  )
}
