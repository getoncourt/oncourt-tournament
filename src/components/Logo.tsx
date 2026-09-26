/** OnCourt logo mark (from OnCourtLogoLogoMarkFit in the design system). */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 116 64" fill="currentColor" className={className} aria-hidden>
      <path d="M 14.362 19.774 C 15.203 18.816 16.711 19.615 16.505 20.872 C 15.724 25.621 15.444 30.504 16.302 35.22 C 17.519 41.905 20.091 47.106 22.927 52.376 C 24.317 54.959 25.771 57.558 27.212 60.402 C 28.057 62.068 26.824 64 24.955 64 L 2.624 64 C 1.311 64 0.204 63.009 0.12 61.7 C 0.041 60.458 0 59.205 0 57.942 C 0 43.322 5.42 29.968 14.362 19.774 Z" />
      <path d="M 58 0 C 68.078 0 77.555 2.568 85.812 7.084 C 89.411 9.053 91.966 12.481 92.928 16.466 C 93.14 17.343 93.344 18.256 93.532 19.195 C 94.544 24.254 95.046 29.739 94.237 34.181 C 93.192 39.924 90.992 44.458 88.212 49.624 C 86.191 53.378 83.862 57.468 81.62 62.454 C 81.2 63.388 80.276 64 79.251 64 L 37.01 64 C 35.985 64 35.061 63.388 34.641 62.454 C 32.4 57.468 30.07 53.378 28.05 49.624 C 25.269 44.458 23.07 39.924 22.024 34.181 C 21.216 29.739 21.717 24.254 22.73 19.195 C 22.934 18.176 23.156 17.187 23.388 16.242 C 24.367 12.246 26.952 8.821 30.579 6.873 C 38.744 2.488 48.081 0 58 0 Z" />
      <path d="M 99.813 21.233 C 99.613 19.972 101.131 19.181 101.965 20.148 C 110.712 30.294 116 43.501 116 57.942 C 116 59.205 115.959 60.458 115.88 61.7 C 115.796 63.009 114.689 64 113.376 64 L 91.307 64 C 89.437 64 88.204 62.068 89.049 60.402 C 90.491 57.558 91.944 54.959 93.334 52.376 C 96.171 47.106 98.743 41.905 99.96 35.22 C 100.796 30.625 100.547 25.866 99.813 21.233 Z" />
    </svg>
  )
}

export function Logo({ onDark = true }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={`h-6 w-auto ${onDark ? 'text-lime-bright' : 'text-lime'}`} />
      <div className="leading-none">
        <div className={`text-lg font-black tracking-tight ${onDark ? 'text-white' : 'text-ink-strong'}`}>OnCourt</div>
        <div className={`mt-0.5 text-xs font-bold ${onDark ? 'text-primary-200' : 'text-muted'}`}>Tournament</div>
      </div>
    </div>
  )
}
