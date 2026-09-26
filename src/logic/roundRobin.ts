/**
 * Circle-method round robin. Returns rounds of [a, b] pairs; byes are dropped.
 */
export function roundRobinRounds<T>(items: T[]): [T, T][][] {
  if (items.length < 2) return []
  const list: (T | null)[] = [...items]
  if (list.length % 2 === 1) list.push(null)
  const n = list.length
  const rounds: [T, T][][] = []
  for (let r = 0; r < n - 1; r++) {
    const round: [T, T][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]
      const b = list[n - 1 - i]
      if (a !== null && b !== null) round.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    rounds.push(round)
    // rotate all but the first element
    list.splice(1, 0, list.pop()!)
  }
  return rounds
}

/**
 * Interleave several groups' rounds so divisions alternate:
 * G1R1, G2R1, G1R2, G2R2, …
 */
export function interleaveGroups<T>(groups: { groupId: string; rounds: [T, T][][] }[]) {
  const out: { groupId: string; pair: [T, T] }[] = []
  const maxRounds = Math.max(0, ...groups.map((g) => g.rounds.length))
  for (let r = 0; r < maxRounds; r++) {
    for (const g of groups) {
      for (const pair of g.rounds[r] ?? []) out.push({ groupId: g.groupId, pair })
    }
  }
  return out
}
