import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { UnitSheet } from '@/components/domain/UnitSheet'
import { Button } from '@/components/ui/Button'
import type { Datasheet } from '@/types/gameData.types'

interface PartySwiperProps {
  datasheets: Datasheet[]
  initialIndex?: number
  onClose: () => void
}

const SWIPE_THRESHOLD = 50

export function PartySwiper({ datasheets, initialIndex = 0, onClose }: PartySwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)

  const goTo = useCallback(
    (index: number, dir: number) => {
      if (index < 0 || index >= datasheets.length) return
      setDirection(dir)
      setCurrentIndex(index)
    },
    [datasheets.length],
  )

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const swipe = info.offset.x
      const velocity = info.velocity.x
      if (swipe < -SWIPE_THRESHOLD || velocity < -500) {
        goTo(currentIndex + 1, 1)
      } else if (swipe > SWIPE_THRESHOLD || velocity > 500) {
        goTo(currentIndex - 1, -1)
      }
    },
    [currentIndex, goTo],
  )

  const current = datasheets[currentIndex]
  if (!current) return null

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 shrink-0"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <span
          className="font-mono text-sm"
          style={{ color: 'var(--color-text-muted)' }}
          aria-live="polite"
        >
          {currentIndex + 1} / {datasheets.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Quitter
        </Button>
      </div>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 overflow-y-auto party-mode-text"
          >
            <UnitSheet datasheet={current} />
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons */}
        {currentIndex > 0 && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
            onClick={() => goTo(currentIndex - 1, -1)}
            aria-label="Unité précédente"
          >
            ‹
          </button>
        )}
        {currentIndex < datasheets.length - 1 && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
            onClick={() => goTo(currentIndex + 1, 1)}
            aria-label="Unité suivante"
          >
            ›
          </button>
        )}
      </div>
    </div>
  )
}
