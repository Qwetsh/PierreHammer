import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react'
import { motion, useMotionValue, useMotionTemplate, useSpring } from 'motion/react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

const SPRING_CONFIG = { stiffness: 300, damping: 30 }
const MAX_ROTATION = 15

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function AnimatedCard({ children, className = '', disabled = false }: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const shineX = useMotionValue(50)
  const shineY = useMotionValue(50)

  const springX = useSpring(rotateX, SPRING_CONFIG)
  const springY = useSpring(rotateY, SPRING_CONFIG)

  const isActive = useRef(false)

  const updateRotation = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (clientX - rect.left) / rect.width
      const y = (clientY - rect.top) / rect.height
      rotateX.set((0.5 - y) * MAX_ROTATION * 2)
      rotateY.set((x - 0.5) * MAX_ROTATION * 2)
      shineX.set(x * 100)
      shineY.set(y * 100)
    },
    [rotateX, rotateY, shineX, shineY],
  )

  const handleTouchStart = useCallback(() => {
    isActive.current = true
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isActive.current) return
      const touch = e.touches[0]
      updateRotation(touch.clientX, touch.clientY)
    },
    [updateRotation],
  )

  const handleTouchEnd = useCallback(() => {
    isActive.current = false
    rotateX.set(0)
    rotateY.set(0)
    shineX.set(50)
    shineY.set(50)
  }, [rotateX, rotateY, shineX, shineY])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updateRotation(e.clientX, e.clientY)
    },
    [updateRotation],
  )

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    shineX.set(50)
    shineY.set(50)
  }, [rotateX, rotateY, shineX, shineY])

  const shineBackground = useMotionTemplate`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`

  if (reducedMotion || disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        rotateX: springX,
        rotateY: springY,
        willChange: 'transform',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          background: shineBackground,
          opacity: 0.8,
        }}
      />
    </motion.div>
  )
}
