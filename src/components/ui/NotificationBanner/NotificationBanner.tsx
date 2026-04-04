import { motion, useMotionValue, useTransform } from 'motion/react'

interface NotificationBannerProps {
  message: string
  onDismiss: () => void
}

export function NotificationBanner({ message, onDismiss }: NotificationBannerProps) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])

  return (
    <motion.div
      className="fixed left-3 right-3 z-[110] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        backgroundColor: 'var(--color-accent)',
        color: '#ffffff',
        x,
        opacity,
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
          onDismiss()
        }
      }}
      role="status"
      aria-live="polite"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="cursor-pointer bg-transparent border-none text-white min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        aria-label="Fermer la notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  )
}
