import type { Court, Match } from '../types'

/** Match occupies a court: being called or playing. */
export const onCourt = (m: Match) => m.status === 'called' || m.status === 'live'

export function busyPlayerIds(matches: Match[]): Set<string> {
  const s = new Set<string>()
  for (const m of matches) if (onCourt(m)) s.add(m.p1).add(m.p2)
  return s
}

export function freeCourts(courts: Court[], matches: Match[]): Court[] {
  const busy = new Set(matches.filter(onCourt).map((m) => m.courtId))
  return courts.filter((c) => !busy.has(c.id))
}

/** A queued match is playable if neither player is on court right now. */
export function isPlayable(m: Match, busy: Set<string>) {
  return m.status === 'queued' && !busy.has(m.p1) && !busy.has(m.p2)
}

/** First queued match (in schedule order) whose players are both free. */
export function nextEligible(matches: Match[]): Match | undefined {
  const busy = busyPlayerIds(matches)
  return matches.find((m) => isPlayable(m, busy))
}
