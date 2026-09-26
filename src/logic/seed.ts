import type { Court, Group, Match, Player } from '../types'
import { interleaveGroups, roundRobinRounds } from './roundRobin'

const COLORS = ['rgb(0,136,255)', 'rgb(197,75,59)', 'rgb(97,85,245)', 'rgb(70,131,82)']

const SEED: Record<string, string[]> = {
  "Men's A": ['Carlos A.', 'Jannik S.', 'Novak D.', 'Daniil M.'],
  "Men's B": ['Taylor F.', 'Casper R.', 'Holger R.', 'Ben S.'],
  "Women's A": ['Iga S.', 'Aryna S.', 'Coco G.', 'Elena R.'],
  "Women's B": ['Jasmine P.', 'Qinwen Z.', 'Mirra A.', 'Emma N.'],
}

export function seedState(makeCourts: (n: number) => Court[]) {
  const groups: Group[] = Object.keys(SEED).map((name, i) => ({ id: `g${i + 1}`, name, color: COLORS[i] }))
  const players: Player[] = groups.flatMap((g) =>
    SEED[g.name].map((name, i) => ({ id: `${g.id}p${i + 1}`, name, groupId: g.id })),
  )
  const plan = interleaveGroups(
    groups.map((g) => ({
      groupId: g.id,
      rounds: roundRobinRounds(players.filter((p) => p.groupId === g.id).map((p) => p.id)),
    })),
  )
  const matches: Match[] = plan.map(({ groupId, pair }, i) => ({
    id: `m${i + 1}`,
    num: i + 1,
    groupId,
    p1: pair[0],
    p2: pair[1],
    status: 'queued',
  }))
  return { players, groups, matches, courts: makeCourts(3), autoAssign: true, nextNum: matches.length + 1 }
}
