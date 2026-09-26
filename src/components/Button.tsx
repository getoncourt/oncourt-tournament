import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  ball: 'bg-ball text-ink',
  court: 'bg-court text-white',
  clay: 'bg-clay text-white',
  white: 'bg-white text-ink',
  ghost: 'bg-transparent text-ink border-transparent! shadow-none!',
}
const SIZES = { sm: 'h-10 text-sm px-3', md: 'h-12 text-base', lg: 'h-14 text-lg px-5' }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

export function Button({ variant = 'white', size = 'md', className = '', ...rest }: Props) {
  return <button type="button" className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest} />
}
