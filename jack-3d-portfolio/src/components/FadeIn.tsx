import type { ElementType, ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type FadeInProps = {
  as?: ElementType
  delay?: number
  duration?: number
  x?: number
  y?: number
  className?: string
  children?: ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>

export function FadeIn({
  as = 'div',
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
  children,
  ...rest
}: FadeInProps) {
  // Prefer motion.create for dynamic tags (per brief); fall back safely.
  const MotionTag = (motion.create
    ? motion.create(as as 'div')
    : motion.div) as typeof motion.div

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
