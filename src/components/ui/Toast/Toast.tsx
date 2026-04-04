import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type ToastVariant = 'success' | 'error'

interface ToastMessage {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.variant === 'success') {
      const timer = setTimeout(() => onDismiss(toast.id), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.variant, onDismiss])

  const bgColor = toast.variant === 'success' ? 'var(--color-success)' : 'var(--color-error)'

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg"
      style={{ backgroundColor: bgColor }}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      {toast.variant === 'error' && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="cursor-pointer bg-transparent border-none text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToasts((prev) => [...prev, { id: ++toastId, message, variant }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div
        className="fixed left-4 right-4 z-[100] flex flex-col gap-2"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}
