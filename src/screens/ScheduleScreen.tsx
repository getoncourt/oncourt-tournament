import { useState } from 'react'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store'
import { useUi } from '../ui'
import { busyPlayerIds, isPlayable, onCourt } from '../logic/courts'
import { fmtDur } from '../logic/time'
import type { Match } from '../types'
import { MatchCard } from '../components/MatchCard'
import { Button } from '../components/Button'
import { useDndSensors } from '../components/dnd'

export function ScheduleScreen() {
  const matches = useStore((s) => s.matches)
  const groups = useStore((s) => s.groups)
  const courts = useStore((s) => s.courts)
  const generate = useStore((s) => s.generateSchedule)
  const moveMatch = useStore((s) => s.moveMatch)
  const reopen = useStore((s) => s.reopenMatch)
  const showToast = useStore((s) => s.showToast)
  const openFinish = useUi((s) => s.openFinish)
  const openActions = useUi((s) => s.openActions)
  const startPlay = useStore((s) => s.startPlay)
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
    if (hasQueued && !confirm('Rebuild the queue? Custom order of upcoming matches will be reset. Live & finished matches are kept.')) return
    const n = generate()
    showToast(n ? `${n} matches scheduled` : 'No new matches — add players to groups first')
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    if (e.over && e.active.id !== e.over.id) moveMatch(String(e.active.id), String(e.over.id))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-ink/60">
            {matches.length} matches · {matches.filter((m) => m.status === 'done').length} done
          </p>
        </div>
        <Button variant="ball" onClick={onGenerate}>
          🎲 {matches.length ? 'Rebuild' : 'Generate'}
        </Button>
      </div>

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
          <div className="text-5xl">📋</div>
          <div className="mt-2 text-lg font-semibold">No matches yet</div>
          <p className="text-ink/60">Put players in groups, then hit Generate for a round-robin.</p>
        </div>
      )}

      {live.length > 0 && (
        <Section title="On court" count={live.length}>
          {live.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              note={
                m.status === 'called' ? (
                  <span className="text-clay">📣 calling · {courtName(m.courtId)}</span>
                ) : (
                  <span className="text-court">● {courtName(m.courtId)}</span>
                )
              }
              right={
                <div className="flex shrink-0 items-center gap-1">
                  {m.status === 'called' ? (
                    <Button variant="clay" size="sm" onClick={() => startPlay(m.id)}>
                      ▶ Play
                    </Button>
                  ) : (
                    <Button variant="ball" size="sm" onClick={() => openFinish(m.id)}>
                      ✓ Finish
                    </Button>
                  )}
                  <button
                    onClick={() => openActions(m.id)}
                    aria-label="Court options"
                    className="grid h-10 w-8 place-items-center rounded-lg text-xl text-ink/50 hover:bg-ink/5"
                  >
                    ⋯
                  </button>
                </div>
              }
            />
          ))}
        </Section>
      )}

      {queued.length > 0 && (
        <Section title="Up next" count={queued.length} hint="Drag ⠿ to reorder · Call sends to a court">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setDragId(String(e.active.id))}
            onDragCancel={() => setDragId(null)}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={queued.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {queued.map((m, i) => (
                <SortableMatch key={m.id} match={m} pos={i + 1} blocked={!isPlayable(m, busy)} />
              ))}
            </SortableContext>
            <DragOverlay>
              {dragId && <MatchCard match={matches.find((m) => m.id === dragId)!} className="scale-105 shadow-2xl" />}
            </DragOverlay>
          </DndContext>
        </Section>
      )}

      {done.length > 0 && (
        <section className="space-y-2.5">
          <button className="flex w-full items-center justify-between py-1" onClick={() => setShowDone((v) => !v)}>
            <h2 className="text-lg font-bold">
              Finished <span className="text-ink/40">{done.length}</span>
            </h2>
            <span className="text-sm font-semibold text-ink/50">{showDone ? 'Hide ▲' : 'Show ▼'}</span>
          </button>
          {showDone &&
            done.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                note={`${courtName(m.courtId) ?? ''} · ${fmtDur((m.finishedAt ?? 0) - (m.startedAt ?? 0))}`}
                right={
                  <button className="text-xs font-semibold text-ink/40 hover:text-clay" onClick={() => reopen(m.id)}>
                    ↺ Reopen
                  </button>
                }
              />
            ))}
        </section>
      )}
    </div>
  )
}

function Section({ title, count, hint, children }: { title: string; count: number; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">
          {title} <span className="text-ink/40">{count}</span>
        </h2>
        {hint && <span className="text-xs text-ink/50">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[3px] px-3 text-sm font-semibold whitespace-nowrap ${
        active ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white'
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  )
}

function SortableMatch({ match, pos, blocked }: { match: Match; pos: number; blocked: boolean }) {
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
      <MatchCard
        match={match}
        dim={blocked}
        note={blocked ? 'player on court' : pos === 1 ? 'next up' : undefined}
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant={blocked ? 'white' : 'ball'}
              size="sm"
              className="w-14 px-0!"
              aria-label={`Send match ${match.num} to a court`}
              onClick={() => openPlay(match.id)}
            >
              Call
            </Button>
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
              className="grid h-10 w-8 cursor-grab touch-none place-items-center rounded-lg text-xl text-ink/40 hover:bg-ink/5 active:cursor-grabbing"
            >
              ⠿
            </button>
          </div>
        }
      />
    </div>
  )
}
