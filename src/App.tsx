import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { SplashScreen } from '@/features/personalization/components/SplashScreen'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { NotificationBanner } from '@/components/ui/NotificationBanner'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useColorVision } from '@/hooks/useColorVision'

const CollectionPage = lazy(() => import('./pages/Collection/CollectionPage').then(m => ({ default: m.CollectionPage })))
const ListsPage = lazy(() => import('./pages/Lists/ListsPage').then(m => ({ default: m.ListsPage })))
const ListDetailPage = lazy(() => import('./pages/Lists/ListDetailPage').then(m => ({ default: m.ListDetailPage })))
const AddUnitPage = lazy(() => import('./pages/Lists/AddUnitPage').then(m => ({ default: m.AddUnitPage })))
const CatalogPage = lazy(() => import('./pages/Catalog/CatalogPage').then(m => ({ default: m.CatalogPage })))
const UnitDetailPage = lazy(() => import('./pages/Catalog/UnitDetailPage').then(m => ({ default: m.UnitDetailPage })))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const GameModePage = lazy(() => import('./pages/GameMode/GameModePage').then(m => ({ default: m.GameModePage })))
const ComparatorPage = lazy(() => import('./pages/Comparator/ComparatorPage').then(m => ({ default: m.ComparatorPage })))

function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: '60vh' }}>
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-accent)' }}>404</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Cette page n'existe pas.
      </p>
      <button
        className="px-4 py-2 rounded-lg font-medium text-sm border-none cursor-pointer min-h-[44px]"
        style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
        onClick={() => navigate('/collection', { replace: true })}
      >
        Retour à la collection
      </button>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center p-8" style={{ color: 'var(--color-text-muted)' }}>
      Chargement...
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname.split('/')[1]}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/collection" replace />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:listId" element={<ListDetailPage />} />
            <Route path="/lists/:listId/add-unit" element={<AddUnitPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:factionId" element={<CatalogPage />} />
            <Route path="/catalog/:factionId/:unitId" element={<UnitDetailPage />} />
            <Route path="/compare" element={<ComparatorPage />} />
            <Route path="/game-mode/:listId" element={<GameModePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function DataUpdateNotification() {
  const notification = useGameDataStore((s) => s.dataUpdateNotification)
  const dismiss = useGameDataStore((s) => s.dismissDataNotification)

  return (
    <AnimatePresence>
      {notification && <NotificationBanner message={notification} onDismiss={dismiss} />}
    </AnimatePresence>
  )
}

function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  return (
    <AnimatePresence>
      {!isOnline && <OfflineBanner />}
    </AnimatePresence>
  )
}

export function App() {
  useColorVision()

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ToastProvider>
          <SplashScreen />
          <OfflineIndicator />
          <DataUpdateNotification />
          <AppShell>
            <AnimatedRoutes />
          </AppShell>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
