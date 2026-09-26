import { useEffect, useState } from 'react'
import { fmtDur } from '../logic/time'

export function Elapsed({ since }: { since?: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!since) return null
  return <span className="tabular-nums">{fmtDur(now - since)}</span>
}
