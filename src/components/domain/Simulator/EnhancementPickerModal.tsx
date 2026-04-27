import type { Enhancement } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'

interface EnhancementPickerModalProps {
  enhancements: Enhancement[]
  selectedEnhancement: Enhancement | null
  onSelect: (enhancement: Enhancement | null) => void
  onClose: () => void
}

export function EnhancementPickerModal({ enhancements, selectedEnhancement, onSelect, onClose }: EnhancementPickerModalProps) {
  return (
    <div data-scroll-lock className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>Optimisation</h3>

        <button
          className="w-full text-left rounded-lg p-3 mb-2 border-none cursor-pointer"
          style={{
            backgroundColor: !selectedEnhancement ? 'var(--color-accent)' : 'var(--color-surface)',
            color: !selectedEnhancement ? '#fff' : 'var(--color-text)',
          }}
          onClick={() => { onSelect(null); onClose() }}
        >
          <span className="text-sm font-medium">Aucune</span>
        </button>

        {enhancements.map((enh) => {
          const isSelected = selectedEnhancement?.id === enh.id
          return (
            <button
              key={enh.id}
              className="w-full text-left rounded-lg p-3 mb-1 border-none cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
                color: isSelected ? '#fff' : 'var(--color-text)',
              }}
              onClick={() => { onSelect(enh); onClose() }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm"><T text={enh.name} category="enhancement" /></span>
                <span className="text-xs" style={{ opacity: 0.7 }}>{enh.cost} pts</span>
              </div>
              <p className="text-xs mt-1 line-clamp-2" style={{ opacity: 0.7 }}>
                {enh.description.replace(/<[^>]*>/g, '').slice(0, 120)}...
              </p>
            </button>
          )
        })}

        <button
          className="mt-3 w-full text-center text-xs bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={onClose}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
