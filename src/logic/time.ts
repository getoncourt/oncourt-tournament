/** 75_000 → "1:15", 3_725_000 → "1:02:05" */
export function fmtDur(ms?: number): string {
  if (ms == null || ms < 0) return '-'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`
}

export const fmtClock = (t?: number) =>
  t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'
