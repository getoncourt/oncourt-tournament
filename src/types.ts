export type Player = { id: string; name: string; groupId: string | null }

export type Group = { id: string; name: string; color: string }

export type Court = { id: string; name: string }

/** queued → called (on court, calling players) → live (playing) → done */
export type MatchStatus = 'queued' | 'called' | 'live' | 'done'

export type Match = {
  id: string
  num: number // stable display number (#1, #2…)
  groupId: string
  p1: string
  p2: string
  status: MatchStatus
  courtId?: string
  calledAt?: number // assigned to court, players being called
  startedAt?: number // players ready, match began
  finishedAt?: number
  winnerId?: string
  score?: string
}
