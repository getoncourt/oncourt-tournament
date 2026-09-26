import type { ReactNode } from 'react'

/** Screen header: title, one line of context, optional actions. */
export function PageHero({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="enter flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl leading-8 font-bold text-ink-strong">{title}</h1>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}
