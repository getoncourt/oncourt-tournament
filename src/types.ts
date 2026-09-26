export type Player = { id: string; name: string; groupId: string | null }

export type Group = { id: string; name: string; color: string }

export type Court = { id: string; name: string }

export type MatchStatus = 'queued' | 'live' | 'done'

export type Match = {
  id: string
  num: number // stable display number (#1, #2…)
  groupId: string
  p1: string
  p2: string
  status: MatchStatus
  courtId?: string
  startedAt?: number
  finishedAt?: number
  winnerId?: string
  score?: string
}
