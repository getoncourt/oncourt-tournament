import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  lime: 'btn-lime',
  warning: 'btn-warning',
  ghost: 'btn-ghost',
}
const SIZES = { sm: 'h-9 text-sm px-4', md: 'h-11 text-[15px]', lg: 'h-13 text-base px-6' }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

/** OnCourt DS button: pill with a hard ledge that collapses on press. */
export function Button({ variant = 'secondary', size = 'md', className = '', ...rest }: Props) {
  return <button type="button" className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest} />
}
