import { motion } from 'motion/react'

export function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed top-0 left-0 right-0 z-[90] text-center py-2 px-4 text-xs font-medium"
      style={{ backgroundColor: 'var(--color-warning, #f59e0b)', color: '#000' }}
    >
      Vous êtes hors ligne — les données locales restent disponibles.
    </motion.div>
  )
}
