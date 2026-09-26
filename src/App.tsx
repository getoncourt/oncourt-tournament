import { useEffect, useState } from 'react'
import { IconBallTennis, IconDotsVertical, IconLayoutList, IconRefresh, IconTrash, IconTrophy, IconUsers, type Icon } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { useStore } from './store'
import { Num } from './components/Num'
import { CourtsScreen } from './screens/CourtsScreen'
import { ScheduleScreen } from './screens/ScheduleScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { StandingsScreen } from './screens/StandingsScreen'
import { PlaySheet } from './components/PlaySheet'
import { FinishSheet } from './components/FinishSheet'
import { CourtActionsSheet } from './components/CourtActionsSheet'
import { Toast } from './components/Toast'
import { Logo } from './components/Logo'

type Tab = 'courts' | 'schedule' | 'players' | 'standings'

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: 'courts', label: 'Courts', icon: IconBallTennis },
  { id: 'schedule', label: 'Schedule', icon: IconLayoutList },
  { id: 'players', label: 'Players', icon: IconUsers },
  { id: 'standings', label: 'Standings', icon: IconTrophy },
]

const readTab = (): Tab => {
  const h = location.hash.slice(1)
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'courts'
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(readTab)
  const onCourtCount = useStore((s) => s.matches.filter((m) => m.status === 'live' || m.status === 'called').length)
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

  const badge = (t: Tab) => (t === 'courts' ? onCourtCount : t === 'schedule' ? queuedCount : 0)

  return (
    <div className="min-h-full md:flex">
      {/* Desktop sidebar */}
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-primary-deep p-4 text-white md:flex">
        <div className="px-2 py-2">
          <Logo />
        </div>
        <div className="mt-6 flex flex-col gap-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`press relative flex h-11 items-center gap-3 rounded-full px-4 text-[15px] font-bold transition-colors duration-200 ${
                  active ? 'text-primary-900' : 'text-primary-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill-desktop"
                    className="absolute inset-0 rounded-full bg-lime-bright shadow-[0_3px_0_0_rgb(127,163,36)]"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <t.icon size={20} stroke={2} className="relative" />
                <span className="relative flex-1 text-left">{t.label}</span>
                {badge(t.id) > 0 && (
                  <span className="relative">
                    <Badge n={badge(t.id)} active={active} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-3 text-sm">
          <ResetButtons resetDemo={resetDemo} clearAll={clearAll} dark />
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-page/90 px-4 py-3 backdrop-blur-md md:hidden">
          <Logo onDark={false} />
          <details className="relative">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line),0_2px_0_0_var(--color-line)]">
              <IconDotsVertical size={18} />
            </summary>
            <div className="card absolute right-0 mt-2 w-48 p-1.5">
              <ResetButtons resetDemo={resetDemo} clearAll={clearAll} />
            </div>
          </details>
        </header>

        <main key={tab} className="enter px-4 pt-2 pb-32 md:p-8 md:pb-10">
          {tab === 'courts' && <CourtsScreen goSchedule={() => setTab('schedule')} />}
          {tab === 'schedule' && <ScheduleScreen />}
          {tab === 'players' && <PlayersScreen goSchedule={() => setTab('schedule')} />}
          {tab === 'standings' && <StandingsScreen />}
        </main>
      </div>

      {/* Mobile floating tab bar (DS: dark teal, lime active pill) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4 pb-3 md:hidden">
        <div className="mb-[env(safe-area-inset-bottom)] grid grid-cols-4 gap-1 rounded-[28px] bg-primary-deep p-1.5 shadow-[0_4px_16px_rgba(0,0,0,.18)]">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`press relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-colors duration-200 ${
                  active ? 'text-primary-900' : 'text-primary-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill-mobile"
                    className="absolute inset-0 rounded-[22px] bg-lime-bright"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <t.icon
                  size={22}
                  stroke={2}
                  className={`relative transition-transform duration-300 ease-[var(--ease-out)] ${active ? '-translate-y-px scale-110' : ''}`}
                />
                <span className="relative">{t.label}</span>
                {badge(t.id) > 0 && (
                  <span className="absolute top-1 right-2">
                    <Badge n={badge(t.id)} active={active} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <PlaySheet />
      <FinishSheet />
      <CourtActionsSheet />
      <Toast />
    </div>
  )
}

function Badge({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] leading-none font-bold tabular-nums ${
        active ? 'bg-primary-deep text-lime-bright' : 'bg-white/15 text-white'
      }`}
    >
      <Num value={n} />
    </span>
  )
}

function ResetButtons({ resetDemo, clearAll, dark }: { resetDemo: () => void; clearAll: () => void; dark?: boolean }) {
  const cls = `flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-bold ${
    dark ? 'text-primary-200 hover:bg-white/10 hover:text-white' : 'text-ink hover:bg-surface-muted'
  }`
  return (
    <>
      <button className={cls} onClick={() => confirm('Reset to demo data?') && resetDemo()}>
        <IconRefresh size={16} /> Reset demo
      </button>
      <button className={cls} onClick={() => confirm('Clear everything and start blank?') && clearAll()}>
        <IconTrash size={16} /> Start blank
      </button>
    </>
  )
}
