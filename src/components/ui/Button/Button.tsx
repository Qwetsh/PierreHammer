import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-forged btn-primary-forged',
  secondary: 'btn-forged btn-secondary-forged',
  ghost: 'btn-forged btn-ghost-forged',
  danger: 'btn-forged btn-danger-forged',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
