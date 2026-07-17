import { useRef, type CSSProperties } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

type AnimatedTextProps = {
  text: string
  className?: string
  style?: CSSProperties
}

function Char({
  char,
  index,
  total,
  progress,
}: {
  char: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const start = index / total
  const end = Math.min(1, (index + 1) / total + 0.08)
  const opacity = useTransform(progress, [start, end], [0.2, 1])

  return (
    <span className="relative inline-block">
      <span className="invisible">{char === ' ' ? '\u00A0' : char}</span>
      <motion.span style={{ opacity }} className="absolute inset-0">
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    </span>
  )
}

export function AnimatedText({ text, className = '', style }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = Array.from(text)

  return (
    <p ref={ref} className={className} style={style}>
      {chars.map((char, i) => (
        <Char
          key={`${i}-${char}`}
          char={char}
          index={i}
          total={chars.length}
          progress={scrollYProgress}
        />
      ))}
    </p>
  )
}
