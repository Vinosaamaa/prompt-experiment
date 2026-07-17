import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { FadeIn } from '../components/FadeIn'
import { LiveProjectButton } from '../components/LiveProjectButton'
import { PROJECTS, type Project } from '../data'

function ProjectCard({
  project,
  index,
  total,
  progress,
}: {
  project: Project
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const targetScale = 1 - (total - 1 - index) * 0.03
  const rangeStart = index / total
  const rangeEnd = 1
  const scale = useTransform(progress, [rangeStart, rangeEnd], [1, targetScale])

  return (
    <div
      className="sticky h-[85vh] top-[calc(6rem+var(--card-offset))] md:top-[calc(8rem+var(--card-offset))]"
      style={{ ['--card-offset' as string]: `${index * 28}px` }}
    >
      <motion.article
        style={{ scale }}
        className="relative flex h-full flex-col overflow-hidden rounded-[40px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:rounded-[50px] sm:p-6 md:rounded-[60px] md:p-8"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
          <div className="flex flex-wrap items-end gap-4 sm:gap-6 md:gap-8">
            <span
              className="font-black leading-none text-[#D7E2EA]"
              style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
            >
              {project.num}
            </span>
            <div className="mb-2 flex flex-col gap-1 sm:mb-4">
              <span className="text-xs font-medium uppercase tracking-widest text-[#D7E2EA]/70 sm:text-sm">
                {project.category}
              </span>
              <h3
                className="font-medium uppercase text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
              >
                {project.name}
              </h3>
            </div>
          </div>
          <LiveProjectButton />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[40%_60%] gap-3 sm:gap-4 md:gap-5">
          <div className="flex min-h-0 flex-col gap-3 sm:gap-4">
            <img
              src={project.images.col1Top}
              alt=""
              className="w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: 'clamp(130px, 16vw, 230px)' }}
              loading="lazy"
            />
            <img
              src={project.images.col1Bottom}
              alt=""
              className="w-full flex-1 rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: 'clamp(160px, 22vw, 340px)' }}
              loading="lazy"
            />
          </div>
          <img
            src={project.images.col2}
            alt=""
            className="h-full min-h-[280px] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            loading="lazy"
          />
        </div>
      </motion.article>
    </div>
  )
}

export function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-5 pb-24 pt-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 sm:pt-24 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pt-32"
    >
      <FadeIn delay={0} y={40} className="mb-16 text-center sm:mb-20 md:mb-28">
        <h2
          className="hero-heading font-black uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          Project
        </h2>
      </FadeIn>

      <div ref={containerRef} className="relative mx-auto max-w-6xl">
        {PROJECTS.map((project, index) => (
          <ProjectCard
            key={project.num}
            project={project}
            index={index}
            total={PROJECTS.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  )
}
