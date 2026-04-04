import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useComparatorStore } from '@/stores/comparatorStore'
import { Button } from '@/components/ui/Button'

export function CompareBar() {
  const navigate = useNavigate()
  const selectedIds = useComparatorStore((s) => s.selectedIds)
  const clear = useComparatorStore((s) => s.clear)

  if (selectedIds.length === 0) return null

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="fixed left-4 right-4 z-[80] flex items-center justify-between rounded-lg px-4 py-3 shadow-lg"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 56px)',
        backgroundColor: 'var(--color-primary)',
      }}
    >
      <span className="text-sm font-medium text-white">
        {selectedIds.length} unité{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
        >
          <span style={{ color: '#fff' }}>Annuler</span>
        </Button>
        {selectedIds.length >= 2 && (
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-medium border-none cursor-pointer min-h-[36px]"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            onClick={() => navigate('/compare')}
          >
            Comparer
          </button>
        )}
      </div>
    </motion.div>
  )
}
