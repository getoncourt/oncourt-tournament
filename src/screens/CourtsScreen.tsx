import { useState } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
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
import { MatchCard } from '../components/MatchCard'
import { Button } from '../components/Button'
import { Stepper } from '../components/Stepper'
import { Toggle } from '../components/Toggle'
import { Elapsed } from '../components/Elapsed'
import { useDndSensors } from '../components/dnd'

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
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl leading-8 font-bold text-ink-strong">Courts</h1>
              <p className="text-sm text-muted">
                {callingCount} calling · {liveCount} live · {queued.length} to play · {doneCount} done
              </p>
            </div>
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
            <Stepper label="Courts" value={courts.length} onChange={setCourtCount} />
            <Toggle checked={autoAssign} onChange={setAutoAssign} label="Auto call next" />
          </div>

          {canFill && (
            <Button variant="primary" size="lg" className="enter w-full" onClick={fillCourts}>
              <IconBolt size={20} /> Fill {freeCount} free court{freeCount === 1 ? '' : 's'}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {courts.map((c) => (
              <CourtTile key={c.id} court={c} match={byCourt.get(c.id)} dragging={!!dragId} />
            ))}
          </div>
        </section>

        {/* Queue */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:w-96 lg:shrink-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg leading-6 font-bold text-ink-strong">Up next</h2>
            <span className="text-xs text-muted">
              <span className="hidden md:inline">Drag onto a court</span>
              <span className="md:hidden">Long-press to drag</span>
            </span>
          </div>
          {queued.length === 0 ? (
            <div className="card p-6 text-center">
              <IconFlag size={32} className="mx-auto text-subtle" />
              <div className="mt-1 font-bold text-ink-strong">{matches.length ? 'All matches played' : 'No schedule yet'}</div>
              {!matches.length && (
                <Button variant="primary" className="mt-3 w-full" onClick={goSchedule}>
                  Go to schedule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-0.5 lg:pb-3">
              {queued.map((m, i) => (
                <QueueItem key={m.id} match={m} blocked={!isPlayable(m, busy)} first={i === 0} />
              ))}
            </div>
          )}
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragMatch && <MatchCard match={dragMatch} className="shadow-[0_4px_16px_rgba(0,0,0,.15)]!" />}
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
    <div ref={setNodeRef} {...listeners} {...attributes} className={`touch-manipulation ${isDragging ? 'opacity-30' : ''}`}>
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
      key={match.id + match.status}
      className={`enter relative flex min-h-48 cursor-grab flex-col overflow-hidden rounded-[20px] text-white md:min-h-56 ${
        calling ? 'court-calling' : 'court-lines'
      } ${drag.isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center justify-between gap-1 px-3 pt-3">
        <span className="text-sm font-bold">{court.name}</span>
        <div className="flex items-center gap-1">
          {calling ? (
            <span className="tag bg-warning text-ink-strong">
              <IconSpeakerphone size={14} />
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
            className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <IconDots size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-center">
        <span className="text-xs font-bold text-primary-200">
          {calling ? 'Calling players' : g?.name} · #{match.num}
        </span>
        <div className="w-full truncate text-base leading-6 font-bold md:text-lg">{players.get(match.p1)?.name}</div>
        <div className="text-[10px] font-black tracking-wider text-lime-bright uppercase">vs</div>
        <div className="w-full truncate text-base leading-6 font-bold md:text-lg">{players.get(match.p2)?.name}</div>
      </div>
      <div className="p-3 pt-0">
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
  const matches = useStore((s) => s.matches)
  const callMatch = useStore((s) => s.callMatch)
  const next = nextEligible(matches)

  return (
    <div
      ref={setNodeRef}
      className={`court-free flex min-h-48 flex-col rounded-[20px] p-3 transition-colors md:min-h-56 ${
        isOver ? 'bg-lime-soft! shadow-[inset_0_0_0_2px_var(--color-lime),0_4px_0_0_var(--color-line)]!' : dragging ? 'shadow-[inset_0_0_0_2px_var(--color-primary-200),0_4px_0_0_var(--color-line)]!' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink-strong">{court.name}</span>
        <span className="tag bg-lime-soft text-lime-900">Free</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
        {isOver ? <IconTarget size={32} className="text-lime-ink" /> : <IconBallTennis size={32} className="text-primary-200" />}
        <div className="text-sm text-muted">{dragging ? 'Drop match here' : 'Court is open'}</div>
      </div>
      {next ? (
        <Button variant="primary" className="h-auto! w-full flex-col gap-0! py-2" onClick={() => callMatch(next.id, court.id)}>
          <span className="flex items-center gap-1.5">
            <IconSpeakerphone size={16} /> Call #{next.num}
          </span>
          <span className="w-full truncate text-xs font-normal opacity-80">
            {players.get(next.p1)?.name} vs {players.get(next.p2)?.name}
          </span>
        </Button>
      ) : (
        <div className="py-3 text-center text-sm text-muted">No match ready</div>
      )}
    </div>
  )
}
