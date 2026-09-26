import { useState } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import { IconArrowsShuffle, IconPlus, IconRefresh, IconTrash, IconUserPlus, IconX } from '@tabler/icons-react'
import { PageHero } from '../components/PageHero'
import { tint } from '../components/MatchCard'
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
        <PageHero
          title="Players"
          sub={
            <>
              {players.length} players · {groups.length} groups · <span className="hidden md:inline">drag</span>
              <span className="md:hidden">long-press</span> to move
            </>
          }
        >
          <Button size="sm" onClick={() => addGroup()}>
            <IconPlus size={16} /> Group
          </Button>
          <Button size="sm" onClick={() => setSplitOpen(true)} disabled={!players.length}>
            <IconArrowsShuffle size={16} /> Auto split
          </Button>
        </PageHero>

        {/* Add players */}
        <div className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
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
            placeholder="Add player name"
            className="min-h-12 flex-1 resize-none rounded-2xl bg-page px-4 py-3 text-base text-ink-strong shadow-[inset_0_0_0_1px_var(--color-line)] outline-none placeholder:text-subtle focus:shadow-[inset_0_0_0_2px_var(--color-primary)]"
          />
          <Button variant="primary" onClick={submit} disabled={!text.trim()}>
            <IconUserPlus size={18} /> Add
          </Button>
        </div>

        {/* Unassigned */}
        <DropZone id={POOL} dragging={!!dragId}>
          <div className="mb-2 text-xs font-bold tracking-[0.01em] text-muted uppercase">
            Unassigned · {pool.length}
          </div>
          {pool.length ? (
            <div className="flex flex-wrap gap-2">
              {pool.map((p) => (
                <PlayerChip key={p.id} player={p} onTap={() => setEditId(p.id)} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">Everyone is in a group</div>
          )}
        </DropZone>

        {/* Groups */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <GroupCard i={i} key={g.id} group={g} players={players.filter((p) => p.groupId === g.id)} dragging={!!dragId} onTap={setEditId} />
          ))}
          <button
            onClick={() => addGroup()}
            className="flex min-h-32 items-center justify-center gap-2 rounded-[20px] font-bold text-primary shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-white"
            style={{ backgroundImage: 'radial-gradient(var(--color-line) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          >
            <IconPlus size={18} /> Add group
          </button>
        </div>

        {groups.some((g) => players.filter((p) => p.groupId === g.id).length >= 2) && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              if (matches.some((m) => m.status === 'queued') && !confirm('Rebuild the queue from current groups? Live and finished matches are kept.')) return
              const n = generate()
              showToast(`${n} matches scheduled`)
              goSchedule()
            }}
          >
            <IconRefresh size={20} /> Generate round robin
          </Button>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragId && <Chip name={players.find((p) => p.id === dragId)?.name ?? ''} className="scale-110 rotate-2 shadow-[0_12px_28px_rgba(4,32,31,.22)]!" />}
      </DragOverlay>

      <EditPlayerSheet id={editId} onClose={() => setEditId(null)} />

      <Sheet open={splitOpen} onClose={() => setSplitOpen(false)} title="Auto split players">
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Spread all {players.length} players across groups in snake order, so list order acts as seeding.
            {started ? ' Existing groups are replaced and upcoming matches are cleared.' : ' Existing groups are replaced.'}
          </p>
          <div className="flex justify-center">
            <Stepper label="Groups" value={splitN} onChange={setSplitN} min={1} max={8} />
          </div>
          <p className="text-center text-sm text-muted">About {Math.ceil(players.length / splitN)} players per group</p>
          <Button
            variant="primary"
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

function DropZone({ id, dragging, children }: { id: string; dragging: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-[20px] p-4 transition-colors ${
        isOver ? 'bg-lime-soft shadow-[inset_0_0_0_2px_var(--color-lime)]' : dragging ? 'bg-white shadow-[inset_0_0_0_2px_var(--color-primary-200)]' : 'bg-surface-muted'
      }`}
    >
      {children}
    </div>
  )
}

function GroupCard({ group, players, dragging, onTap, i }: { group: Group; players: Player[]; dragging: boolean; onTap: (id: string) => void; i: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const renameGroup = useStore((s) => s.renameGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const matchCount = (players.length * (players.length - 1)) / 2
  return (
    <div
      ref={setNodeRef}
      style={{ '--i': i } as CSSProperties}
      className={`card enter overflow-hidden transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] ${isOver ? 'scale-[1.02]' : ''} ${
        isOver ? 'shadow-[inset_0_0_0_2px_var(--color-lime),0_4px_0_0_var(--color-line)]!' : dragging ? 'shadow-[inset_0_0_0_2px_var(--color-primary-200),0_4px_0_0_var(--color-line)]!' : ''
      }`}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 text-white"
        style={{ background: group.color }}
      >
        <input
          value={group.name}
          onChange={(e) => renameGroup(group.id, e.target.value)}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-base font-bold outline-none focus:bg-white/20"
          aria-label="Group name"
        />
        <span className="tag bg-white/25 text-white">{players.length}</span>
        <button
          onClick={() => confirm(`Remove ${group.name}? Players go back to unassigned.`) && removeGroup(group.id)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-black/15"
          aria-label={`Remove ${group.name}`}
        >
          <IconX size={16} />
        </button>
      </div>
      <div className="min-h-24 p-3 transition-colors duration-200" style={{ background: isOver ? 'var(--color-lime-soft)' : tint(group.color, 6) }}>
        {players.length ? (
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <PlayerChip key={p.id} player={p} onTap={() => onTap(p.id)} />
            ))}
          </div>
        ) : (
          <div className="grid h-16 place-items-center text-sm text-muted">Drop players here</div>
        )}
      </div>
      <div className="border-t border-line px-4 py-2 text-xs text-muted">
        {matchCount} round robin match{matchCount === 1 ? '' : 'es'}
      </div>
    </div>
  )
}

/** DS Chip: pill, white with lifted ledge. */
function Chip({ name, color, className = '' }: { name: string; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-full bg-white pr-3.5 pl-1.5 text-sm font-bold text-ink-strong shadow-[inset_0_0_0_1px_var(--color-line-strong),0_2px_0_0_var(--color-line-strong)] ${className}`}
    >
      <span
        className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black"
        style={{ background: tint(color ?? 'rgb(142,149,147)', 18), color: color ?? 'rgb(107,112,111)' }}
      >
        {name.trim().slice(0, 1).toUpperCase()}
      </span>
      {name}
    </span>
  )
}

function PlayerChip({ player, onTap }: { player: Player; onTap: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: player.id })
  const color = useStore((s) => s.groups.find((g) => g.id === player.groupId)?.color)
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onTap}
      className={`press swap-in cursor-grab transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      <Chip name={player.name} color={color} />
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
    <Sheet open={!!player} onClose={onClose} title="Edit player">
      {player && (
        <div className="space-y-5">
          <input
            value={player.name}
            onChange={(e) => rename(player.id, e.target.value)}
            className="h-12 w-full rounded-2xl bg-white px-4 text-base font-bold text-ink-strong shadow-[inset_0_0_0_1px_var(--color-line-strong)] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-primary)]"
            aria-label="Player name"
          />
          <div>
            <div className="mb-2 text-xs font-bold tracking-[0.01em] text-muted uppercase">Group</div>
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
                    className={`btn h-11 justify-start px-4 text-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ background: g.color }} />
                    <span className="truncate">{g.name}</span>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  assign(player.id, null)
                  onClose()
                }}
                className={`btn h-11 px-4 text-sm ${!player.groupId ? 'btn-primary' : 'btn-secondary'}`}
              >
                Unassigned
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full text-danger! hover:bg-mojo-soft/40!"
            onClick={() => {
              if (confirm(`Remove ${player.name}? Their upcoming matches are removed too.`)) {
                remove(player.id)
                onClose()
              }
            }}
          >
            <IconTrash size={18} /> Remove player
          </Button>
        </div>
      )}
    </Sheet>
  )
}
