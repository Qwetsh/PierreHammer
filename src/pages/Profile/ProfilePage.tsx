import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useExportImport } from '@/hooks/useExportImport'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { usePreferencesStore, type ColorVisionMode } from '@/stores/preferencesStore'
import { useAuthStore } from '@/stores/authStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

const COLOR_VISION_OPTIONS: { value: ColorVisionMode; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Vision standard' },
  { value: 'deuteranopia', label: 'Deuteranopie', description: 'Difficulté rouge-vert (la plus courante)' },
  { value: 'protanopia', label: 'Protanopie', description: 'Difficulté rouge-vert' },
  { value: 'tritanopia', label: 'Tritanopie', description: 'Difficulté bleu-jaune' },
]

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function AuthSection() {
  const { user, isAuthenticated, loading, signUp, signIn, signOut } = useAuthStore()
  const profile = useFriendsStore((s) => s.profile)
  const loadProfile = useFriendsStore((s) => s.loadProfile)
  const updateUsername = useFriendsStore((s) => s.updateUsername)
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  useEffect(() => {
    if (isAuthenticated) loadProfile()
  }, [isAuthenticated, loadProfile])

  if (!isSupabaseConfigured) return null
  if (loading) {
    return (
      <div className="rounded-lg p-4 mb-8" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="rounded-lg p-4 mb-8" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Compte</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Connecté en tant que <strong style={{ color: 'var(--color-text)' }}>{user.email}</strong>
        </p>
        {/* Username display/edit */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pseudo :</span>
          {editingUsername ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="rounded px-2 py-1 text-sm border-none outline-none"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', width: '150px' }}
                autoFocus
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!USERNAME_REGEX.test(newUsername)}
                onClick={async () => {
                  const ok = await updateUsername(newUsername)
                  if (ok) {
                    showToast('Pseudo mis à jour', 'success')
                    setEditingUsername(false)
                  } else {
                    showToast('Erreur lors de la mise à jour', 'error')
                  }
                }}
              >
                OK
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingUsername(false)}>
                ✕
              </Button>
            </div>
          ) : (
            <>
              <strong className="text-sm" style={{ color: 'var(--color-text)' }}>
                {profile?.username || '—'}
              </strong>
              <button
                className="text-xs bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => {
                  setNewUsername(profile?.username || '')
                  setEditingUsername(true)
                }}
              >
                Modifier
              </button>
            </>
          )}
        </div>
        {editingUsername && !USERNAME_REGEX.test(newUsername) && newUsername.length > 0 && (
          <p className="text-xs mb-2" style={{ color: 'var(--color-error)' }}>
            3-20 caractères, lettres, chiffres, tirets ou underscores
          </p>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await signOut()
            showToast('Déconnexion réussie', 'success')
          }}
        >
          Se déconnecter
        </Button>
      </div>
    )
  }

  const emailValid = validateEmail(email)
  const passwordValid = password.length >= 6
  const usernameValid = !isSignUp || USERNAME_REGEX.test(username)
  const canSubmit = emailValid && passwordValid && usernameValid && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    if (isSignUp) {
      const { error } = await signUp(email, password)
      setSubmitting(false)
      if (error) {
        showToast(error.message, 'error')
      } else {
        // Set username after signup
        if (username.trim()) {
          await updateUsername(username.trim())
        }
        showToast('Compte créé avec succès !', 'success')
        setEmail('')
        setPassword('')
        setUsername('')
      }
    } else {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) {
        showToast(error.message, 'error')
      } else {
        showToast('Connexion réussie !', 'success')
        setEmail('')
        setPassword('')
      }
    }
  }

  return (
    <div className="rounded-lg p-4 mb-8" style={{ backgroundColor: 'var(--color-surface)' }}>
      <h2 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
        {isSignUp ? 'Créer un compte' : 'Se connecter'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Pseudo (3-20 caractères)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg px-3 py-2.5 text-sm border-none min-h-[44px]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
              aria-label="Pseudo"
              autoComplete="username"
            />
            {username.length > 0 && !USERNAME_REGEX.test(username) && (
              <p className="text-xs -mt-2" style={{ color: 'var(--color-error)' }}>
                Lettres, chiffres, tirets ou underscores (3-20 car.)
              </p>
            )}
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border-none min-h-[44px]"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          aria-label="Email"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Mot de passe (6+ caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border-none min-h-[44px]"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          aria-label="Mot de passe"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
        </Button>
      </form>
      <button
        className="mt-3 text-sm border-none bg-transparent cursor-pointer"
        style={{ color: 'var(--color-accent)' }}
        onClick={() => setIsSignUp(!isSignUp)}
        type="button"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button>
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { exportData, importData } = useExportImport()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const collectionCount = Object.keys(useCollectionStore((s) => s.items)).length
  const listsCount = Object.keys(useListsStore((s) => s.lists)).length
  const colorVisionMode = usePreferencesStore((s) => s.colorVisionMode)
  const setColorVisionMode = usePreferencesStore((s) => s.setColorVisionMode)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const hasData = collectionCount > 0 || listsCount > 0
    if (hasData && !window.confirm('Cela va remplacer toutes tes données actuelles. Continuer ?')) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const result = await importData(file)
    if (result.success) {
      showToast('Données importées avec succès !', 'success')
    } else {
      showToast(`Fichier invalide: ${result.error}`, 'error')
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6" style={{ fontSize: 'var(--text-2xl)' }}>Profil</h1>

      <AuthSection />

      {isAuthenticated && (
        <div className="mb-4">
          <Button variant="secondary" onClick={() => navigate('/profile/history')}>
            Historique des parties
          </Button>
        </div>
      )}

      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate('/simulate')}>
          Simulateur de combat
        </Button>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Mes données</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {collectionCount} unité{collectionCount !== 1 ? 's' : ''} dans ma collection
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {listsCount} liste{listsCount !== 1 ? 's' : ''} d'armée
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Accessibilité</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Adapte les couleurs pour les personnes daltoniennes.
          </p>
          <div className="flex flex-col gap-1.5">
            {COLOR_VISION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left border-none cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: colorVisionMode === opt.value ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: colorVisionMode === opt.value ? '#ffffff' : 'var(--color-text)',
                }}
                onClick={() => setColorVisionMode(opt.value)}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border-2"
                  style={{
                    borderColor: colorVisionMode === opt.value ? '#ffffff' : 'var(--color-text-muted)',
                    backgroundColor: colorVisionMode === opt.value ? '#ffffff' : 'transparent',
                  }}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs" style={{ opacity: 0.7 }}>{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Sauvegarde</h2>
        <Button variant="secondary" onClick={exportData}>
          Exporter mes données
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          Importer mes données
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
          aria-label="Importer un fichier JSON"
        />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          L'import remplace toutes les données existantes. Exporte d'abord si tu veux garder tes données actuelles.
        </p>
      </div>

      <div className="mt-8 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>À propos</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
          PierreHammer — Companion app Warhammer 40K
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Créé avec amour par Thomas pour Pierre.
        </p>
      </div>
    </div>
  )
}
