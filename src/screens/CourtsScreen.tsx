import { useState } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { useGroupMap, usePlayerMap, useStore } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, isPlayable, nextEligible } from '../logic/courts'
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
  const startMatch = useStore((s) => s.startMatch)
  const fillCourts = useStore((s) => s.fillCourts)
  const showToast = useStore((s) => s.showToast)
  const sensors = useDndSensors()
  const [dragId, setDragId] = useState<string | null>(null)

  const liveByCourt = new Map(matches.filter((m) => m.status === 'live').map((m) => [m.courtId, m]))
  const queued = matches.filter((m) => m.status === 'queued')
  const busy = busyPlayerIds(matches)
  const doneCount = matches.filter((m) => m.status === 'done').length
  const freeCount = courts.filter((c) => !liveByCourt.has(c.id)).length
  const canFill = freeCount > 0 && !!nextEligible(matches)
  const dragMatch = matches.find((m) => m.id === dragId)

  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    const m = matches.find((x) => x.id === e.active.id)
    const court = courts.find((c) => c.id === e.over?.id)
    if (!m || !court || liveByCourt.has(court.id)) return
    if (!isPlayable(m, busy)) {
      showToast('A player in that match is on court right now')
      return
    }
    startMatch(m.id, court.id)
    showToast(`Match #${m.num} started on ${court.name}`)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragId(String(e.active.id))}
      onDragCancel={() => setDragId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-start">
        {/* Courts board */}
        <section className="min-w-0 flex-1 space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-3">
            <Stepper label="courts" value={courts.length} onChange={setCourtCount} />
            <div className="flex gap-4 text-center leading-none">
              <Stat n={liveByCourt.size} label="live" color="text-court" />
              <Stat n={queued.length} label="to play" />
              <Stat n={doneCount} label="done" color="text-ink/50" />
            </div>
            <Toggle checked={autoAssign} onChange={setAutoAssign} label="Auto next" />
          </div>

          {canFill && (
            <Button
              variant="ball"
              size="lg"
              className="pop w-full"
              onClick={() => {
                const n = fillCourts()
                showToast(`${n} match${n === 1 ? '' : 'es'} started`)
              }}
            >
              ⚡ Fill {freeCount} free court{freeCount === 1 ? '' : 's'}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {courts.map((c) => (
              <CourtTile key={c.id} court={c} live={liveByCourt.get(c.id)} dragging={!!dragId} />
            ))}
          </div>
        </section>

        {/* Queue */}
        <aside className="space-y-3 lg:sticky lg:top-4 lg:w-96 lg:shrink-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Up next</h2>
            <span className="text-xs text-ink/50">
              <span className="hidden md:inline">Drag onto a court</span>
              <span className="md:hidden">Long-press to drag</span>
            </span>
          </div>
          {queued.length === 0 ? (
            <div className="rounded-2xl border-[3px] border-dashed border-ink/20 p-6 text-center text-ink/60">
              <div className="text-3xl">🏁</div>
              {matches.length ? 'All matches played!' : 'No schedule yet.'}
              {!matches.length && (
                <Button variant="ball" className="mt-3 w-full" onClick={goSchedule}>
                  Go to schedule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:p-1 lg:pb-3">
              {queued.map((m, i) => (
                <QueueItem key={m.id} match={m} blocked={!isPlayable(m, busy)} first={i === 0} />
              ))}
            </div>
          )}
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragMatch && <MatchCard match={dragMatch} className="rotate-2 scale-105 shadow-2xl" />}
      </DragOverlay>
    </DndContext>
  )
}

function Stat({ n, label, color = '' }: { n: number; label: string; color?: string }) {
  return (
    <div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{n}</div>
      <div className="text-[11px] font-semibold tracking-wide text-ink/50 uppercase">{label}</div>
    </div>
  )
}

function QueueItem({ match, blocked, first }: { match: Match; blocked: boolean; first: boolean }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: match.id })
  const openPlay = useUi((s) => s.openPlay)
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`touch-manipulation ${isDragging ? 'opacity-30' : ''}`}>
      <MatchCard
        match={match}
        dim={blocked}
        note={blocked ? 'player on court' : first ? 'next up' : undefined}
        className="cursor-grab active:cursor-grabbing"
        right={
          <Button
            variant={blocked ? 'white' : 'ball'}
            size="sm"
            className="w-12 shrink-0 px-0!"
            aria-label={`Play match ${match.num}`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={() => openPlay(match.id)}
          >
            ▶
          </Button>
        }
      />
    </div>
  )
}

function CourtTile({ court, live, dragging }: { court: Court; live?: Match; dragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: court.id, disabled: !!live })
  const players = usePlayerMap()
  const groups = useGroupMap()
  const matches = useStore((s) => s.matches)
  const startMatch = useStore((s) => s.startMatch)
  const showToast = useStore((s) => s.showToast)
  const openFinish = useUi((s) => s.openFinish)

  if (live) {
    const g = groups.get(live.groupId)
    return (
      <div key={live.id} className="pop card court-lines relative flex min-h-44 flex-col overflow-hidden text-white md:min-h-52">
        <div className="flex items-center justify-between gap-1 px-2 pt-2 md:px-3 md:pt-3">
          <span className="rounded-lg bg-ink/70 px-2 py-0.5 text-xs font-bold md:text-sm">{court.name}</span>
          <span className="flex items-center gap-1.5 rounded-lg bg-ink/70 px-2 py-0.5 text-xs font-semibold md:text-sm">
            <span className="live-dot h-2 w-2 rounded-full bg-red-500" />
            <Elapsed since={live.startedAt} />
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-center">
          <span className="rounded-md px-2 text-xs font-bold" style={{ background: g?.color }}>
            {g?.name} · #{live.num}
          </span>
          <div className="w-full truncate text-base leading-tight font-bold drop-shadow md:text-xl">{players.get(live.p1)?.name}</div>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-ball text-xs font-black text-ink">VS</div>
          <div className="w-full truncate text-base leading-tight font-bold drop-shadow md:text-xl">{players.get(live.p2)?.name}</div>
        </div>
        <div className="p-2 pt-0 md:p-3 md:pt-0">
          <Button variant="ball" size="md" className="w-full" onClick={() => openFinish(live.id)}>
            ✓ Finish
          </Button>
        </div>
      </div>
    )
  }

  const next = nextEligible(matches)
  return (
    <div
      ref={setNodeRef}
      className={`card court-empty flex min-h-44 flex-col p-2.5 md:min-h-52 md:p-3 transition-transform ${
        isOver ? 'scale-[1.03] bg-ball/40!' : dragging ? 'outline-4 outline-offset-2 outline-ball outline-dashed' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-court px-2 py-0.5 text-sm font-bold text-white">{court.name}</span>
        <span className="text-sm font-semibold text-court">Free</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-court-dark">
        <div className="text-3xl md:text-4xl">{isOver ? '🎯' : '🎾'}</div>
        <div className="text-sm font-medium opacity-70">{dragging ? 'Drop match here' : 'Court is open'}</div>
      </div>
      {next ? (
        <Button
          variant="court"
          className="h-auto! w-full flex-col gap-0! py-2"
          onClick={() => {
            startMatch(next.id, court.id)
            showToast(`Match #${next.num} started on ${court.name}`)
          }}
        >
          <span>▶ Start #{next.num}</span>
          <span className="w-full truncate text-xs font-normal opacity-80">
            {players.get(next.p1)?.name} vs {players.get(next.p2)?.name}
          </span>
        </Button>
      ) : (
        <div className="py-3 text-center text-sm text-ink/50">No match ready</div>
      )}
    </div>
  )
}
