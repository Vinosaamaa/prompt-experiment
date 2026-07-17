import { useEffect, useRef, useState } from 'react'
import { MARQUEE_GIFS } from '../data'

function Row({
  images,
  direction,
  offset,
}: {
  images: readonly string[]
  direction: 'left' | 'right'
  offset: number
}) {
  const tiles = [...images, ...images, ...images]
  const tx =
    direction === 'right' ? offset - 200 : -(offset - 200)

  return (
    <div
      className="flex gap-3"
      style={{
        transform: `translateX(${tx}px)`,
        willChange: 'transform',
      }}
    >
      {tiles.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          loading="lazy"
          className="h-[270px] w-[420px] shrink-0 rounded-2xl object-cover"
        />
      ))}
    </div>
  )
}

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const top = el.offsetTop
      const next =
        (window.scrollY - top + window.innerHeight) * 0.3
      setOffset(next)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const row1 = MARQUEE_GIFS.slice(0, 11)
  const row2 = MARQUEE_GIFS.slice(11)

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-[#0C0C0C] pb-10 pt-24 sm:pt-32 md:pt-40"
    >
      <div className="flex flex-col gap-3">
        <Row images={row1} direction="right" offset={offset} />
        <Row images={row2} direction="left" offset={offset} />
      </div>
    </section>
  )
}
