import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconClipboardList,
  IconDots,
  IconGripVertical,
  IconPlayerPlayFilled,
  IconRefresh,
} from '@tabler/icons-react'
import { useStore } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, isPlayable, onCourt } from '../logic/courts'
import { fmtDur } from '../logic/time'
import type { Match } from '../types'
import { MatchCard } from '../components/MatchCard'
import { Button } from '../components/Button'
import { useDndSensors } from '../components/dnd'
import { Num } from '../components/Num'
import { PageHero } from '../components/PageHero'

const OUT = [0.23, 1, 0.32, 1] as const

export function ScheduleScreen() {
  const matches = useStore((s) => s.matches)
  const groups = useStore((s) => s.groups)
  const courts = useStore((s) => s.courts)
  const generate = useStore((s) => s.generateSchedule)
  const moveMatch = useStore((s) => s.moveMatch)
  const reopen = useStore((s) => s.reopenMatch)
  const showToast = useStore((s) => s.showToast)
  const startPlay = useStore((s) => s.startPlay)
  const openFinish = useUi((s) => s.openFinish)
  const openActions = useUi((s) => s.openActions)
  const sensors = useDndSensors()
  const [filter, setFilter] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const inFilter = (m: Match) => !filter || m.groupId === filter
  const live = matches.filter((m) => onCourt(m) && inFilter(m))
  const queued = matches.filter((m) => m.status === 'queued' && inFilter(m))
  const done = matches.filter((m) => m.status === 'done' && inFilter(m))
  const busy = busyPlayerIds(matches)
  const courtName = (id?: string) => courts.find((c) => c.id === id)?.name

  const onGenerate = () => {
    const hasQueued = matches.some((m) => m.status === 'queued')
    if (hasQueued && !confirm('Rebuild the queue? Custom order of upcoming matches will be reset. Live and finished matches are kept.')) return
    const n = generate()
    showToast(n ? `${n} matches scheduled` : 'No new matches. Add players to groups first.')
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    if (e.over && e.active.id !== e.over.id) moveMatch(String(e.active.id), String(e.over.id))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHero
        title="Schedule"
        sub={`${matches.length} matches · ${matches.filter((m) => m.status === 'done').length} done`}
      >
        <Button variant={matches.length ? 'secondary' : 'primary'} size="sm" onClick={onGenerate}>
          <IconRefresh size={16} /> {matches.length ? 'Rebuild' : 'Generate'}
        </Button>
      </PageHero>

      {groups.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip active={!filter} onClick={() => setFilter(null)} label="All" />
          {groups.map((g) => (
            <FilterChip key={g.id} active={filter === g.id} onClick={() => setFilter(g.id)} label={g.name} color={g.color} />
          ))}
        </div>
      )}

      {matches.length === 0 && (
        <div className="card p-8 text-center">
          <IconClipboardList size={40} className="mx-auto text-subtle" />
          <div className="mt-2 text-lg font-bold text-ink-strong">No matches yet</div>
          <p className="text-sm text-muted">Put players in groups, then generate a round robin.</p>
        </div>
      )}

      {live.length > 0 && (
        <Section title="On court" count={live.length} tone="bg-lime-soft text-lime-900">
          <AnimatePresence initial={false} mode="popLayout">
          {live.map((m) => (
            <motion.div
              key={m.id + m.status}
              layout
              initial={{ opacity: 0, transform: 'scale(0.97)', filter: 'blur(4px)' }}
              animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
              exit={{ opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.16 } }}
              transition={{ duration: 0.26, ease: OUT }}
            >
            <MatchCard
              match={m}
              note={
                m.status === 'called' ? (
                  <span className="text-[rgb(170,130,0)]">{courtName(m.courtId)}</span>
                ) : (
                  <span className="text-primary">{courtName(m.courtId)}</span>
                )
              }
              right={
                <div className="flex shrink-0 items-center gap-1">
                  {m.status === 'called' ? (
                    <Button variant="warning" size="sm" onClick={() => startPlay(m.id)}>
                      <IconPlayerPlayFilled size={14} className="hidden sm:block" /> Start
                    </Button>
                  ) : (
                    <Button variant="lime" size="sm" onClick={() => openFinish(m.id)}>
                      <IconCheck size={16} stroke={2.5} className="hidden sm:block" /> Finish
                    </Button>
                  )}
                  <button
                    onClick={() => openActions(m.id)}
                    aria-label="Court options"
                    className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-muted"
                  >
                    <IconDots size={18} />
                  </button>
                </div>
              }
            />
            </motion.div>
          ))}
          </AnimatePresence>
        </Section>
      )}

      {queued.length > 0 && (
        <Section title="Up next" count={queued.length} hint="Drag to reorder" tone="bg-blue-soft text-blue">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setDragId(String(e.active.id))}
            onDragCancel={() => setDragId(null)}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={queued.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {queued.map((m, i) => (
                <SortableMatch key={m.id} match={m} pos={i + 1} blocked={!isPlayable(m, busy)} i={Math.min(i, 10)} />
              ))}
            </SortableContext>
            <DragOverlay>
              {dragId && (
                <MatchCard match={matches.find((m) => m.id === dragId)!} className="shadow-[0_4px_16px_rgba(0,0,0,.15)]!" />
              )}
            </DragOverlay>
          </DndContext>
        </Section>
      )}

      {done.length > 0 && (
        <section className="space-y-2.5">
          <button className="flex w-full items-center justify-between py-1" onClick={() => setShowDone((v) => !v)}>
            <h2 className="text-lg leading-6 font-bold text-ink-strong">
              Finished{' '}
              <span className="ml-1 rounded-full bg-indigo-soft px-2 align-middle text-xs leading-5 text-indigo">
                <Num value={done.length} />
              </span>
            </h2>
            <span className="flex items-center gap-1 text-sm font-bold text-primary">
              {showDone ? 'Hide' : 'Show'}
              <IconChevronDown size={16} className={`transition-transform ${showDone ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {showDone &&
            done.map((m, i) => (
              <MatchCard
                className="enter"
                style={{ '--i': Math.min(i, 10) } as CSSProperties}
                key={m.id}
                match={m}
                note={`${courtName(m.courtId) ?? ''} · ${fmtDur((m.finishedAt ?? 0) - (m.startedAt ?? 0))}`}
                right={
                  <Button variant="ghost" size="sm" className="px-3!" onClick={() => reopen(m.id)}>
                    <IconArrowBackUp size={16} /> Reopen
                  </Button>
                }
              />
            ))}
        </section>
      )}
    </div>
  )
}

function Section({
  title,
  count,
  hint,
  tone,
  children,
}: {
  title: string
  count: number
  hint?: string
  tone: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-lg leading-6 font-bold text-ink-strong">
          {title}
          <span className={`rounded-full px-2 text-xs leading-5 ${tone}`}>
            <Num value={count} />
          </span>
        </h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

/** DS TabMenu (colored): selected = teal fill, others white with ledge. */
function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-secondary relative h-9 shrink-0 px-4 text-sm whitespace-nowrap ${active ? 'text-white!' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="schedule-filter"
          className="absolute inset-0 rounded-full bg-primary shadow-[0_4px_0_0_var(--color-primary-deep)]"
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        />
      )}
      {color && <span className="relative h-2 w-2 rounded-full ring-2 ring-white/70" style={{ background: color }} />}
      <span className="relative">{label}</span>
    </button>
  )
}

function SortableMatch({ match, pos, blocked, i }: { match: Match; pos: number; blocked: boolean; i: number }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: match.id,
  })
  const openPlay = useUi((s) => s.openPlay)
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-30' : ''}
    >
      <div className="enter" style={{ '--i': i } as CSSProperties}>
      <MatchCard
        match={match}
        dim={blocked}
        note={blocked ? 'Player on court' : pos === 1 ? <span className="text-primary">Next up</span> : undefined}
        right={
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant={blocked ? 'secondary' : 'primary'}
              size="sm"
              aria-label={`Call match ${match.num} to a court`}
              onClick={() => openPlay(match.id)}
            >
              Call
            </Button>
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
              className="grid h-10 w-8 cursor-grab touch-none place-items-center rounded-lg text-subtle hover:bg-surface-muted active:cursor-grabbing"
            >
              <IconGripVertical size={18} />
            </button>
          </div>
        }
      />
      </div>
    </div>
  )
}
