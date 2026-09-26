import { describe, expect, it } from 'vitest'
import { interleaveGroups, roundRobinRounds } from './roundRobin'
import { nextEligible } from './courts'
import type { Match } from '../types'

describe('roundRobinRounds', () => {
  for (const n of [2, 3, 4, 5, 8, 9]) {
    it(`covers every pair exactly once for ${n} players`, () => {
      const players = Array.from({ length: n }, (_, i) => `p${i}`)
      const pairs = roundRobinRounds(players).flat()
      expect(pairs.length).toBe((n * (n - 1)) / 2)
      const keys = new Set(pairs.map(([a, b]) => [a, b].sort().join('-')))
      expect(keys.size).toBe(pairs.length)
    })
  }

  it('never puts a player twice in one round', () => {
    for (const round of roundRobinRounds(['a', 'b', 'c', 'd', 'e', 'f'])) {
      const seen = round.flat()
      expect(new Set(seen).size).toBe(seen.length)
    }
  })

  it('interleaves groups round by round', () => {
    const out = interleaveGroups([
      { groupId: 'A', rounds: roundRobinRounds(['a1', 'a2']) },
      { groupId: 'B', rounds: roundRobinRounds(['b1', 'b2']) },
    ])
    expect(out.map((o) => o.groupId)).toEqual(['A', 'B'])
  })
})

describe('nextEligible', () => {
  const m = (id: string, p1: string, p2: string, status: Match['status'] = 'queued'): Match => ({
    id, num: 0, groupId: 'g', p1, p2, status,
  })

  it('skips matches with a player already on court', () => {
    const matches = [m('1', 'a', 'b', 'live'), m('2', 'a', 'c'), m('3', 'd', 'e')]
    expect(nextEligible(matches)?.id).toBe('3')
  })

  it('returns undefined when nothing is playable', () => {
    expect(nextEligible([m('1', 'a', 'b', 'live'), m('2', 'b', 'a')])).toBeUndefined()
  })
})
