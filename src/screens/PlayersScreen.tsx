import { useState } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { useStore } from '../store'
import type { Group, Player } from '../types'
import { Button } from '../components/Button'
import { Sheet } from '../components/Sheet'
import { Stepper } from '../components/Stepper'
import { useDndSensors } from '../components/dnd'

const POOL = '__pool__'

export function PlayersScreen({ goSchedule }: { goSchedule: () => void }) {
  const players = useStore((s) => s.players)
  const groups = useStore((s) => s.groups)
  const matches = useStore((s) => s.matches)
  const addPlayers = useStore((s) => s.addPlayers)
  const assign = useStore((s) => s.assignPlayer)
  const addGroup = useStore((s) => s.addGroup)
  const autoSplit = useStore((s) => s.autoSplit)
  const generate = useStore((s) => s.generateSchedule)
  const showToast = useStore((s) => s.showToast)
  const sensors = useDndSensors()
  const [text, setText] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [splitOpen, setSplitOpen] = useState(false)
  const [splitN, setSplitN] = useState(Math.max(2, groups.length))

  const pool = players.filter((p) => !p.groupId || !groups.some((g) => g.id === p.groupId))
  const started = matches.some((m) => m.status !== 'queued')

  const submit = () => {
    if (!text.trim()) return
    addPlayers(text, null)
    setText('')
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    if (!e.over) return
    assign(String(e.active.id), e.over.id === POOL ? null : String(e.over.id))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragId(String(e.active.id))}
      onDragCancel={() => setDragId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Players & groups</h1>
            <p className="text-sm text-ink/60">
              {players.length} players · {groups.length} groups · <span className="hidden md:inline">drag</span>
              <span className="md:hidden">long-press</span> a player to move, tap to edit
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addGroup()}>
              + Group
            </Button>
            <Button size="sm" onClick={() => setSplitOpen(true)} disabled={!players.length}>
              🔀 Auto-split
            </Button>
          </div>
        </div>

        {/* Add players */}
        <div className="card flex flex-col gap-2 p-3 sm:flex-row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder="Add player name…"
            className="min-h-12 flex-1 resize-none rounded-xl bg-ink/5 px-4 py-3 text-lg outline-none focus:bg-ball/20"
          />
          <Button variant="court" className="sm:w-28" onClick={submit} disabled={!text.trim()}>
            + Add
          </Button>
        </div>

        {/* Unassigned */}
        <DropZone id={POOL} className="rounded-2xl border-[3px] border-dashed border-ink/20 p-3" dragging={!!dragId}>
          <div className="mb-2 text-sm font-semibold text-ink/60">
            Unassigned <span className="text-ink/40">{pool.length}</span>
          </div>
          {pool.length ? (
            <div className="flex flex-wrap gap-2">
              {pool.map((p) => (
                <PlayerChip key={p.id} player={p} onTap={() => setEditId(p.id)} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-ink/40">Everyone's in a group 👍</div>
          )}
        </DropZone>

        {/* Groups */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} players={players.filter((p) => p.groupId === g.id)} dragging={!!dragId} onTap={setEditId} />
          ))}
          <button
            onClick={() => addGroup()}
            className="grid min-h-32 place-items-center rounded-2xl border-[3px] border-dashed border-ink/20 font-semibold text-ink/50 hover:bg-white"
          >
            + Add group
          </button>
        </div>

        {groups.some((g) => players.filter((p) => p.groupId === g.id).length >= 2) && (
          <Button
            variant="ball"
            size="lg"
            className="w-full"
            onClick={() => {
              if (matches.some((m) => m.status === 'queued') && !confirm('Rebuild the queue from current groups? Live & finished matches are kept.')) return
              const n = generate()
              showToast(`${n} matches scheduled`)
              goSchedule()
            }}
          >
            🎲 Generate round-robin schedule
          </Button>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragId && <Chip name={players.find((p) => p.id === dragId)?.name ?? ''} className="scale-110 rotate-3 shadow-xl" />}
      </DragOverlay>

      <EditPlayerSheet id={editId} onClose={() => setEditId(null)} />

      <Sheet open={splitOpen} onClose={() => setSplitOpen(false)} title="Auto-split players">
        <div className="space-y-4">
          <p className="text-ink/70">
            Spread all {players.length} players across groups (snake order, so list order acts as seeding).
            {started ? ' Existing groups are replaced; upcoming matches are cleared.' : ' Existing groups are replaced.'}
          </p>
          <div className="flex justify-center">
            <Stepper label="groups" value={splitN} onChange={setSplitN} min={1} max={8} />
          </div>
          <p className="text-center text-sm text-ink/50">≈ {Math.ceil(players.length / splitN)} players per group</p>
          <Button
            variant="ball"
            size="lg"
            className="w-full"
            onClick={() => {
              autoSplit(splitN)
              setSplitOpen(false)
              showToast(`Split into ${splitN} groups`)
            }}
          >
            Split into {splitN}
          </Button>
        </div>
      </Sheet>
    </DndContext>
  )
}

function DropZone({ id, className, dragging, children }: { id: string; className: string; dragging: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`${className} transition ${isOver ? 'bg-ball/30' : dragging ? 'bg-white/60' : ''}`}>
      {children}
    </div>
  )
}

function GroupCard({ group, players, dragging, onTap }: { group: Group; players: Player[]; dragging: boolean; onTap: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const renameGroup = useStore((s) => s.renameGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const matchCount = (players.length * (players.length - 1)) / 2
  return (
    <div
      ref={setNodeRef}
      className={`card overflow-hidden transition-transform ${isOver ? 'scale-[1.02]' : ''} ${dragging && !isOver ? 'outline-2 outline-ink/20 outline-dashed' : ''}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 text-white" style={{ background: group.color }}>
        <input
          value={group.name}
          onChange={(e) => renameGroup(group.id, e.target.value)}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-lg font-bold outline-none focus:bg-white/20"
          aria-label="Group name"
        />
        <span className="shrink-0 rounded-lg bg-black/20 px-2 text-sm font-semibold">{players.length}</span>
        <button
          onClick={() => confirm(`Remove ${group.name}? Players go back to Unassigned.`) && removeGroup(group.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xl hover:bg-black/20"
          aria-label={`Remove ${group.name}`}
        >
          ×
        </button>
      </div>
      <div className={`min-h-24 p-3 ${isOver ? 'bg-ball/30' : ''}`}>
        {players.length ? (
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <PlayerChip key={p.id} player={p} onTap={() => onTap(p.id)} />
            ))}
          </div>
        ) : (
          <div className="grid h-16 place-items-center text-sm text-ink/40">Drop players here</div>
        )}
      </div>
      <div className="border-t-2 border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/50">
        {matchCount} round-robin match{matchCount === 1 ? '' : 'es'}
      </div>
    </div>
  )
}

function Chip({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex h-10 items-center rounded-xl border-[3px] border-ink bg-white px-3 font-medium shadow-[0_3px_0_var(--color-ink)] ${className}`}
    >
      {name}
    </span>
  )
}

function PlayerChip({ player, onTap }: { player: Player; onTap: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: player.id })
  return (
    <button ref={setNodeRef} {...listeners} {...attributes} onClick={onTap} className={`pop cursor-grab ${isDragging ? 'opacity-30' : ''}`}>
      <Chip name={player.name} />
    </button>
  )
}

function EditPlayerSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const player = useStore((s) => s.players.find((p) => p.id === id))
  const groups = useStore((s) => s.groups)
  const rename = useStore((s) => s.renamePlayer)
  const assign = useStore((s) => s.assignPlayer)
  const remove = useStore((s) => s.removePlayer)

  return (
    <Sheet open={!!player} onClose={onClose} title="Player">
      {player && (
        <div className="space-y-4">
          <input
            value={player.name}
            onChange={(e) => rename(player.id, e.target.value)}
            className="h-12 w-full rounded-2xl border-[3px] border-ink bg-white px-4 text-lg outline-none focus:bg-ball/20"
            aria-label="Player name"
          />
          <div>
            <div className="mb-2 text-sm font-semibold text-ink/60">Move to group</div>
            <div className="grid grid-cols-2 gap-2">
              {groups.map((g) => {
                const active = player.groupId === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      assign(player.id, g.id)
                      onClose()
                    }}
                    className={`btn h-12 justify-start text-left ${active ? 'text-white' : 'bg-white'}`}
                    style={active ? { background: g.color } : undefined}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-ink" style={{ background: g.color }} />
                    <span className="truncate">{g.name}</span>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  assign(player.id, null)
                  onClose()
                }}
                className={`btn h-12 ${!player.groupId ? 'bg-ink text-white' : 'bg-white'}`}
              >
                Unassigned
              </button>
            </div>
          </div>
          <button
            className="w-full py-2 text-sm font-semibold text-clay-dark"
            onClick={() => {
              if (confirm(`Remove ${player.name}? Their upcoming matches are removed too.`)) {
                remove(player.id)
                onClose()
              }
            }}
          >
            🗑 Remove player
          </button>
        </div>
      )}
    </Sheet>
  )
}
