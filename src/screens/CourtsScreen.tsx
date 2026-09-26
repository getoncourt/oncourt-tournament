import { useState, type CSSProperties, type ReactNode } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'motion/react'
import {
  IconBallTennis,
  IconBolt,
  IconCheck,
  IconDots,
  IconFlag,
  IconPlayerPlayFilled,
  IconSpeakerphone,
  IconTarget,
} from '@tabler/icons-react'
import { useGroupMap, usePlayerMap, useStore } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, isPlayable, nextEligible, onCourt } from '../logic/courts'
import type { Court, Match } from '../types'
import { MatchCard, tint } from '../components/MatchCard'
import { Button } from '../components/Button'
import { Stepper } from '../components/Stepper'
import { Toggle } from '../components/Toggle'
import { Elapsed } from '../components/Elapsed'
import { Num } from '../components/Num'
import { useDndSensors } from '../components/dnd'

const OUT = [0.23, 1, 0.32, 1] as const

const STATUS = [
  { key: 'done', label: 'Done', bar: 'bg-primary' },
  { key: 'live', label: 'Live', bar: 'bg-lime' },
  { key: 'called', label: 'Calling', bar: 'bg-warning' },
  { key: 'queued', label: 'To play', bar: 'bg-line-strong' },
] as const

export function CourtsScreen({ goSchedule }: { goSchedule: () => void }) {
  const courts = useStore((s) => s.courts)
  const matches = useStore((s) => s.matches)
  const autoAssign = useStore((s) => s.autoAssign)
  const setAutoAssign = useStore((s) => s.setAutoAssign)
  const setCourtCount = useStore((s) => s.setCourtCount)
  const callMatch = useStore((s) => s.callMatch)
  const moveToCourt = useStore((s) => s.moveToCourt)
  const fillCourts = useStore((s) => s.fillCourts)
  const showToast = useStore((s) => s.showToast)
  const sensors = useDndSensors()
  const [dragId, setDragId] = useState<string | null>(null)

  const byCourt = new Map(matches.filter(onCourt).map((m) => [m.courtId, m]))
  const queued = matches.filter((m) => m.status === 'queued')
  const busy = busyPlayerIds(matches)
  const liveCount = matches.filter((m) => m.status === 'live').length
  const callingCount = matches.filter((m) => m.status === 'called').length
  const doneCount = matches.filter((m) => m.status === 'done').length
  const freeCount = courts.filter((c) => !byCourt.has(c.id)).length
  const canFill = freeCount > 0 && !!nextEligible(matches)
  const dragMatch = matches.find((m) => m.id === dragId)
  const counts = { done: doneCount, live: liveCount, called: callingCount, queued: queued.length }

  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    const m = matches.find((x) => x.id === e.active.id)
    const court = courts.find((c) => c.id === e.over?.id)
    if (!m || !court || byCourt.has(court.id)) return
    // dragging a match that's already on a court = move it
    if (onCourt(m)) return moveToCourt(m.id, court.id)
    if (!isPlayable(m, busy)) return showToast('A player in that match is on court now')
    callMatch(m.id, court.id)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragId(String(e.active.id))}
      onDragCancel={() => setDragId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
        {/* Courts board */}
        <section className="min-w-0 flex-1 space-y-4">
          <div className="enter flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl leading-8 font-bold text-ink-strong">Courts</h1>
              <p className="text-sm text-muted">
                {doneCount} of {matches.length} matches done
              </p>
            </div>
          </div>

          {/* Status: one stacked bar in the same colors as the court tiles */}
          <div className="card enter p-4" style={{ '--i': 1 } as CSSProperties}>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {STATUS.map((st) => (
                <div
                  key={st.key}
                  className={`h-full rounded-full transition-[flex-grow] duration-500 ease-[var(--ease-out)] ${st.bar}`}
                  style={{ flexGrow: counts[st.key], flexBasis: 0 }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {STATUS.map((st) => (
                <div key={st.key}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted">
                    <span className={`h-2 w-2 rounded-full ${st.bar}`} />
                    {st.label}
                  </div>
                  <div className="overflow-hidden text-xl leading-7 font-black text-ink-strong">
                    <Num value={counts[st.key]} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-3">
              <Stepper label="Courts" value={courts.length} onChange={setCourtCount} />
              <Toggle checked={autoAssign} onChange={setAutoAssign} label="Auto call next" />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {canFill && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.16 } }}
                transition={{ duration: 0.24, ease: OUT }}
                className="overflow-hidden"
              >
                <Button variant="primary" size="lg" className="mb-1 w-full" onClick={fillCourts}>
                  <IconBolt size={20} /> Fill {freeCount} free court{freeCount === 1 ? '' : 's'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {courts.map((c, i) => (
              <div key={c.id} className="enter" style={{ '--i': i + 2 } as CSSProperties}>
                <CourtTile court={c} match={byCourt.get(c.id)} dragging={!!dragId} />
              </div>
            ))}
          </div>
        </section>

        {/* Queue */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:w-96 lg:shrink-0">
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 text-lg leading-6 font-bold text-ink-strong">
              Up next
              <span className="rounded-full bg-blue-soft px-2 text-xs leading-5 text-blue">
                <Num value={queued.length} />
              </span>
            </h2>
            <span className="text-xs text-muted">
              <span className="hidden md:inline">Drag onto a court</span>
              <span className="md:hidden">Long-press to drag</span>
            </span>
          </div>
          {queued.length === 0 ? (
            <div className="card swap-in p-6 text-center">
              <IconFlag size={32} className="mx-auto text-lime" />
              <div className="mt-1 font-bold text-ink-strong">{matches.length ? 'All matches played' : 'No schedule yet'}</div>
              {!matches.length && (
                <Button variant="primary" className="mt-3 w-full" onClick={goSchedule}>
                  Go to schedule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-0.5 lg:pb-3">
              <AnimatePresence initial={false} mode="popLayout">
                {queued.map((m, i) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                    exit={{ opacity: 0, transform: 'translateX(-24px) scale(0.96)', transition: { duration: 0.18 } }}
                    transition={{ duration: 0.26, ease: OUT, layout: { duration: 0.28, ease: OUT } }}
                  >
                    <QueueItem match={m} blocked={!isPlayable(m, busy)} first={i === 0} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </aside>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {dragMatch && <MatchCard match={dragMatch} className="scale-[1.03] rotate-1 shadow-[0_12px_28px_rgba(4,32,31,.22)]!" />}
      </DragOverlay>
    </DndContext>
  )
}

/** Keep button taps from starting a drag on the draggable parent. */
const noDrag = {
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
  onKeyDown: (e: React.SyntheticEvent) => e.stopPropagation(),
}

function QueueItem({ match, blocked, first }: { match: Match; blocked: boolean; first: boolean }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: match.id })
  const openPlay = useUi((s) => s.openPlay)
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`touch-manipulation transition-opacity ${isDragging ? 'opacity-30' : ''}`}>
      <MatchCard
        match={match}
        dim={blocked}
        note={blocked ? 'Player on court' : first ? <span className="text-primary">Next up</span> : undefined}
        className="cursor-grab active:cursor-grabbing"
        right={
          <Button
            variant={blocked ? 'secondary' : 'primary'}
            size="sm"
            className="shrink-0"
            aria-label={`Call match ${match.num} to a court`}
            {...noDrag}
            onClick={() => openPlay(match.id)}
          >
            Call
          </Button>
        }
      />
    </div>
  )
}

function CourtTile({ court, match, dragging }: { court: Court; match?: Match; dragging: boolean }) {
  const drop = useDroppable({ id: court.id, disabled: !!match })
  if (match) return <OccupiedCourt court={court} match={match} />
  return <FreeCourt court={court} dragging={dragging} setNodeRef={drop.setNodeRef} isOver={drop.isOver} />
}

function OccupiedCourt({ court, match }: { court: Court; match: Match }) {
  const drag = useDraggable({ id: match.id })
  const players = usePlayerMap()
  const g = useGroupMap().get(match.groupId)
  const startPlay = useStore((s) => s.startPlay)
  const openFinish = useUi((s) => s.openFinish)
  const openActions = useUi((s) => s.openActions)
  const calling = match.status === 'called'

  return (
    <div
      ref={drag.setNodeRef}
      {...drag.listeners}
      {...drag.attributes}
      // new key per state → blur crossfade + attention ring replay on every transition
      key={match.id + match.status}
      className={`swap-in ring-once relative flex min-h-48 cursor-grab flex-col rounded-[20px] text-white md:min-h-56 ${
        calling ? 'court-calling' : 'court-lines'
      } ${drag.isDragging ? 'opacity-30' : ''}`}
      style={{ '--ring': calling ? 'var(--color-warning)' : 'var(--color-lime-bright)' } as CSSProperties}
    >
      <div className="relative flex items-center justify-between gap-1 px-3 pt-3">
        <span className="text-sm font-bold">{court.name}</span>
        <div className="flex items-center gap-1">
          {calling ? (
            <span className="tag bg-warning text-ink-strong">
              <IconSpeakerphone size={14} className="origin-left animate-[wiggle_1.6s_ease-in-out_infinite]" />
              <Elapsed since={match.calledAt} />
            </span>
          ) : (
            <span className="tag bg-lime-bright text-primary-900">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-danger" />
              <Elapsed since={match.startedAt} />
            </span>
          )}
          <button
            {...noDrag}
            onClick={() => openActions(match.id)}
            aria-label={`${court.name} options`}
            className="press grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <IconDots size={16} />
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-center">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold"
          style={{ background: tint(g?.color, 22), color: g?.color }}
        >
          {g?.name} · #{match.num}
        </span>
        <div className="w-full truncate text-base leading-6 font-bold md:text-lg">{players.get(match.p1)?.name}</div>
        <div className="text-[10px] font-black tracking-wider text-lime-bright uppercase">vs</div>
        <div className="w-full truncate text-base leading-6 font-bold md:text-lg">{players.get(match.p2)?.name}</div>
      </div>
      <div className="relative p-3 pt-0">
        {calling ? (
          <Button variant="warning" className="w-full" {...noDrag} onClick={() => startPlay(match.id)}>
            <IconPlayerPlayFilled size={16} /> Start match
          </Button>
        ) : (
          <Button variant="lime" className="w-full" {...noDrag} onClick={() => openFinish(match.id)}>
            <IconCheck size={18} stroke={2.5} /> Finish
          </Button>
        )}
      </div>
    </div>
  )
}

function FreeCourt({
  court,
  dragging,
  setNodeRef,
  isOver,
}: {
  court: Court
  dragging: boolean
  setNodeRef: (el: HTMLElement | null) => void
  isOver: boolean
}) {
  const players = usePlayerMap()
  const groups = useGroupMap()
  const matches = useStore((s) => s.matches)
  const callMatch = useStore((s) => s.callMatch)
  const next = nextEligible(matches)
  const nextColor = next ? groups.get(next.groupId)?.color : undefined

  return (
    <div
      ref={setNodeRef}
      className={`court-free swap-in flex min-h-48 flex-col rounded-[20px] p-3 md:min-h-56 ${
        isOver
          ? 'scale-[1.03] bg-lime-soft! shadow-[inset_0_0_0_2px_var(--color-lime),0_4px_0_0_var(--color-line)]!'
          : dragging
            ? 'shadow-[inset_0_0_0_2px_var(--color-primary-200),0_4px_0_0_var(--color-line)]!'
            : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink-strong">{court.name}</span>
        <span className="tag bg-lime-soft text-lime-900">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Free
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
        <div className={`transition-transform duration-200 ease-[var(--ease-out)] ${isOver ? 'scale-125' : dragging ? 'scale-110' : ''}`}>
          {isOver ? <IconTarget size={32} className="text-lime-ink" /> : <IconBallTennis size={32} className="text-lime" />}
        </div>
        <div className="text-sm text-muted">{dragging ? 'Drop match here' : 'Court is open'}</div>
      </div>
      {next ? (
        <Button variant="primary" className="h-auto! w-full flex-col gap-0! py-2" onClick={() => callMatch(next.id, court.id)}>
          <span className="flex items-center gap-1.5">
            <IconSpeakerphone size={16} /> Call #{next.num}
          </span>
          <span className="flex w-full items-center justify-center gap-1 truncate text-xs font-normal opacity-85">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: nextColor }} />
            <span className="truncate">
              {players.get(next.p1)?.name} vs {players.get(next.p2)?.name}
            </span>
          </span>
        </Button>
      ) : (
        <div className="py-3 text-center text-sm text-muted">No match ready</div>
      )}
    </div>
  )
}
