import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { pressable } from '../../fx/variants'

type Variant = 'primary' | 'ghost' | 'danger' | 'default'

/**
 * Themed arcane button with a press spring and a shimmer sweep. Wraps a native <button> so it keeps
 * type/disabled/onClick semantics. `accent` lets a caller tint the glow to an element/tag color.
 */
export function ArcaneButton({
  children,
  onClick,
  disabled,
  variant = 'default',
  accent,
  className = '',
  type = 'button',
  style,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: Variant
  accent?: string
  className?: string
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  return (
    <motion.button
      type={type}
      className={`arcane-btn arcane-btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={accent ? { ['--btn-accent' as string]: accent, ...style } : style}
      whileTap={disabled ? undefined : pressable.whileTap}
      whileHover={disabled ? undefined : pressable.whileHover}
    >
      <span className="arcane-btn-shimmer" aria-hidden />
      <span className="arcane-btn-label">{children}</span>
    </motion.button>
  )
}
