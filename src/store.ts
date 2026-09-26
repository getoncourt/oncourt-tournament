import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Court, Group, Match, Player } from './types'
import { interleaveGroups, roundRobinRounds } from './logic/roundRobin'
import { freeCourts, nextEligible, onCourt } from './logic/courts'
import { seedState } from './logic/seed'

export const GROUP_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#22c55e']

const uid = () => Math.random().toString(36).slice(2, 10)

export type Toast = { id: string; text: string; undo?: () => void }

type Data = {
  players: Player[]
  groups: Group[]
  courts: Court[]
  matches: Match[] // array order == schedule order
  autoAssign: boolean
  nextNum: number
}

type State = Data & {
  toast: Toast | null
  showToast: (text: string, undo?: () => void) => void
  dismissToast: () => void

  addPlayers: (text: string, groupId?: string | null) => void
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  assignPlayer: (playerId: string, groupId: string | null) => void

  addGroup: (name?: string) => void
  renameGroup: (id: string, name: string) => void
  removeGroup: (id: string) => void
  autoSplit: (n: number) => void

  generateSchedule: () => number
  moveMatch: (fromId: string, toId: string) => void

  setCourtCount: (n: number) => boolean
  setAutoAssign: (v: boolean) => void

  /** Put a queued match on a court in "calling players" state. */
  callMatch: (matchId: string, courtId: string) => void
  /** Move a called/live match to another free court. */
  moveToCourt: (matchId: string, courtId: string) => void
  /** Players ready: called → live. */
  startPlay: (matchId: string) => void
  /** Live → back to calling (started by mistake). */
  unstart: (matchId: string) => void
  /** Take a called/live match off court, back to the queue. */
  cancelMatch: (matchId: string) => void
  finishMatch: (matchId: string, winnerId: string, score?: string) => void
  fillCourts: () => number
  reopenMatch: (matchId: string) => void

  resetDemo: () => void
  clearAll: () => void
}

const called = (m: Match, courtId: string): Match => ({
  ...m,
  status: 'called',
  courtId,
  calledAt: Date.now(),
  startedAt: undefined,
})
const queued = (m: Match): Match => ({
  ...m,
  status: 'queued',
  courtId: undefined,
  calledAt: undefined,
  startedAt: undefined,
  finishedAt: undefined,
  winnerId: undefined,
  score: undefined,
})

const courtName = (i: number) => `Court ${i + 1}`
const makeCourts = (n: number): Court[] => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, name: courtName(i) }))

export const useStore = create<State>()(
  persist(
    (set, get) => {
      /** Apply a matches update and show a toast whose Undo restores the previous matches. */
      const commit = (text: string | (() => string), update: (ms: Match[]) => Match[]) => {
        const before = get().matches
        set({ matches: update(before) })
        get().showToast(typeof text === 'function' ? text() : text, () => set({ matches: before }))
      }
      return {
      ...seedState(makeCourts),
      toast: null,

      showToast: (text, undo) => set({ toast: { id: uid(), text, undo } }),
      dismissToast: () => set({ toast: null }),

      addPlayers: (text, groupId = null) => {
        const names = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
        if (!names.length) return
        set((s) => ({ players: [...s.players, ...names.map((name) => ({ id: uid(), name, groupId }))] }))
      },
      removePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          matches: s.matches.filter((m) => m.status !== 'queued' || (m.p1 !== id && m.p2 !== id)),
        })),
      renamePlayer: (id, name) => set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, name } : p)) })),
      assignPlayer: (playerId, groupId) =>
        set((s) => ({ players: s.players.map((p) => (p.id === playerId ? { ...p, groupId } : p)) })),

      addGroup: (name) =>
        set((s) => {
          const i = s.groups.length
          return {
            groups: [...s.groups, { id: uid(), name: name || `Group ${String.fromCharCode(65 + i)}`, color: GROUP_COLORS[i % GROUP_COLORS.length] }],
          }
        }),
      renameGroup: (id, name) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
      removeGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          players: s.players.map((p) => (p.groupId === id ? { ...p, groupId: null } : p)),
          matches: s.matches.filter((m) => m.groupId !== id || m.status !== 'queued'),
        })),
      autoSplit: (n) =>
        set((s) => {
          const groups: Group[] = Array.from({ length: n }, (_, i) => ({
            id: uid(),
            name: `Group ${String.fromCharCode(65 + i)}`,
            color: GROUP_COLORS[i % GROUP_COLORS.length],
          }))
          // snake distribution keeps list order as rough seeding
          const players = s.players.map((p, i) => {
            const row = Math.floor(i / n)
            const col = row % 2 === 0 ? i % n : n - 1 - (i % n)
            return { ...p, groupId: groups[col].id }
          })
          return { groups, players, matches: s.matches.filter((m) => m.status !== 'queued') }
        }),

      generateSchedule: () => {
        const s = get()
        const kept = s.matches.filter((m) => m.status !== 'queued')
        const played = new Set(kept.map((m) => [m.p1, m.p2].sort().join('|')))
        const plan = interleaveGroups(
          s.groups.map((g) => ({
            groupId: g.id,
            rounds: roundRobinRounds(s.players.filter((p) => p.groupId === g.id).map((p) => p.id)),
          })),
        )
        let num = kept.reduce((mx, m) => Math.max(mx, m.num), 0)
        const fresh: Match[] = plan
          .filter(({ pair }) => !played.has([...pair].sort().join('|')))
          .map(({ groupId, pair }) => ({ id: uid(), num: ++num, groupId, p1: pair[0], p2: pair[1], status: 'queued' }))
        set({ matches: [...kept, ...fresh], nextNum: num + 1 })
        return fresh.length
      },
      moveMatch: (fromId, toId) =>
        set((s) => {
          const arr = [...s.matches]
          const from = arr.findIndex((m) => m.id === fromId)
          const to = arr.findIndex((m) => m.id === toId)
          if (from < 0 || to < 0) return {}
          const [m] = arr.splice(from, 1)
          arr.splice(to, 0, m)
          return { matches: arr }
        }),

      setCourtCount: (n) => {
        const s = get()
        n = Math.max(1, Math.min(12, n))
        if (n < s.courts.length) {
          const removed = s.courts.slice(n)
          if (s.matches.some((m) => onCourt(m) && removed.some((c) => c.id === m.courtId))) {
            get().showToast(`${removed[removed.length - 1].name} is in use`)
            return false
          }
          set({ courts: s.courts.slice(0, n) })
        } else {
          const extra = Array.from({ length: n - s.courts.length }, (_, k) => {
            const i = s.courts.length + k
            return { id: `c${uid()}`, name: courtName(i) }
          })
          set({ courts: [...s.courts, ...extra] })
        }
        return true
      },
      setAutoAssign: (v) => set({ autoAssign: v }),

      callMatch: (matchId, courtId) => {
        const m = get().matches.find((x) => x.id === matchId)
        const court = get().courts.find((c) => c.id === courtId)
        if (!m || !court) return
        commit(`#${m.num} → ${court.name} · calling players`, (ms) =>
          ms.map((x) => (x.id === matchId ? called(x, courtId) : x)),
        )
      },
      moveToCourt: (matchId, courtId) => {
        const m = get().matches.find((x) => x.id === matchId)
        const court = get().courts.find((c) => c.id === courtId)
        if (!m || !court) return
        commit(`#${m.num} moved to ${court.name}`, (ms) => ms.map((x) => (x.id === matchId ? { ...x, courtId } : x)))
      },
      startPlay: (matchId) => {
        const m = get().matches.find((x) => x.id === matchId)
        if (!m || m.status !== 'called') return
        commit(`#${m.num} started — play!`, (ms) =>
          ms.map((x) => (x.id === matchId ? { ...x, status: 'live' as const, startedAt: Date.now() } : x)),
        )
      },
      unstart: (matchId) => {
        const m = get().matches.find((x) => x.id === matchId)
        if (!m) return
        commit(`#${m.num} back to calling`, (ms) =>
          ms.map((x) => (x.id === matchId ? { ...x, status: 'called' as const, startedAt: undefined } : x)),
        )
      },
      cancelMatch: (matchId) => {
        const m = get().matches.find((x) => x.id === matchId)
        if (!m) return
        commit(`#${m.num} back to queue`, (ms) => ms.map((x) => (x.id === matchId ? queued(x) : x)))
      },
      finishMatch: (matchId, winnerId, score) => {
        const match = get().matches.find((m) => m.id === matchId)
        if (!match || match.status !== 'live') return
        const court = get().courts.find((c) => c.id === match.courtId)
        let text = `Match #${match.num} finished`
        commit(
          () => text,
          (ms) => {
            ms = ms.map((m) =>
              m.id === matchId ? { ...m, status: 'done' as const, winnerId, score, finishedAt: Date.now() } : m,
            )
            if (get().autoAssign && court) {
              const next = nextEligible(ms)
              if (next) {
                ms = ms.map((m) => (m.id === next.id ? called(m, court.id) : m))
                text = `${court.name} → #${next.num} · calling players`
              }
            }
            return ms
          },
        )
      },
      fillCourts: () => {
        let count = 0
        commit(
          () => `${count} match${count === 1 ? '' : 'es'} called to court`,
          (ms) => {
            for (const c of freeCourts(get().courts, ms)) {
              const next = nextEligible(ms)
              if (!next) break
              ms = ms.map((m) => (m.id === next.id ? called(m, c.id) : m))
              count++
            }
            return ms
          },
        )
        return count
      },
      reopenMatch: (matchId) => {
        const m = get().matches.find((x) => x.id === matchId)
        if (!m) return
        commit(`#${m.num} reopened`, (ms) => ms.map((x) => (x.id === matchId ? queued(x) : x)))
      },

      resetDemo: () => set({ ...seedState(makeCourts), toast: null }),
      clearAll: () => set({ players: [], groups: [], matches: [], courts: makeCourts(2), nextNum: 1, toast: null }),
      }
    },
    {
      name: 'oncourt-tournament-v2',
      partialize: ({ players, groups, courts, matches, autoAssign, nextNum }) => ({
        players, groups, courts, matches, autoAssign, nextNum,
      }),
    },
  ),
)

/** Lookup helpers */
export const usePlayerMap = () => {
  const players = useStore((s) => s.players)
  return new Map(players.map((p) => [p.id, p]))
}
export const useGroupMap = () => {
  const groups = useStore((s) => s.groups)
  return new Map(groups.map((g) => [g.id, g]))
}
