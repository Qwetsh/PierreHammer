import { useCallback } from 'react'
import { motion } from 'motion/react'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { Button } from '@/components/ui/Button'

export function SplashScreen() {
  const hasSeenSplash = usePreferencesStore((s) => s.hasSeenSplash)
  const markSplashSeen = usePreferencesStore((s) => s.markSplashSeen)

  const handleDismiss = useCallback(() => {
    markSplashSeen()
  }, [markSplashSeen])

  if (hasSeenSplash) return null

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 text-center max-w-sm"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="text-5xl"
          initial={{ rotateY: -180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        >
          ⚔️
        </motion.div>

        <h1
          className="font-bold"
          style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          PierreHammer
        </h1>

        <p className="text-base" style={{ color: 'var(--color-text)' }}>
          {/* Placeholder — Thomas personnalisera ce texte */}
          Salut Pierre ! Cette app a été créée spécialement pour toi.
          Gère ta collection, construis tes listes et domine le champ de bataille !
        </p>

        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Pour l'Empereur... ou pas. À toi de choisir.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <Button variant="primary" onClick={handleDismiss}>
            Entrer dans le Warp
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
