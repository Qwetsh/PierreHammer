import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useExportImport } from '@/hooks/useExportImport'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { usePreferencesStore, type ColorVisionMode } from '@/stores/preferencesStore'
import type { FactionSummary } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'
import { useAuthStore } from '@/stores/authStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { HudTopBar, HudPanel, HudStat, HudBtn, MTopBar, MSection } from '@/components/ui/Hud'
import { useAchievements, type Achievement, type AchievementCategory } from '@/hooks/useAchievements'
import { useGameDataStore } from '@/stores/gameDataStore'

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

function BadgeTooltip({ achievement, anchorRef, onClose }: { achievement: Achievement; anchorRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    const tooltip = tooltipRef.current
    if (!anchor || !tooltip) return

    const anchorRect = anchor.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const pad = 8

    // Try above, then below
    let top = anchorRect.top - tooltipRect.height - 6
    if (top < pad) top = anchorRect.bottom + 6

    // Center horizontally, clamp to viewport
    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
    left = Math.max(pad, Math.min(left, window.innerWidth - tooltipRect.width - pad))

    setPos({ top, left })
  }, [anchorRef])

  // Close on outside click/touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose, anchorRef])

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 100,
        background: 'var(--color-surface)',
        border: `1px solid ${achievement.unlocked ? 'var(--color-accent)' : 'var(--color-border)'}`,
        padding: '8px 12px',
        maxWidth: 220,
        pointerEvents: 'auto',
        opacity: pos ? 1 : 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>{achievement.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: achievement.unlocked ? 'var(--color-accent)' : 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
          {achievement.label}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
        {achievement.description}
      </div>
      {achievement.target > 1 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {achievement.current}/{achievement.target}
            </span>
            <span style={{ fontSize: 8, color: achievement.unlocked ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {Math.round((achievement.current / achievement.target) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}>
            <div style={{
              height: '100%',
              width: `${Math.round((achievement.current / achievement.target) * 100)}%`,
              background: achievement.unlocked ? 'var(--color-success)' : CATEGORY_META[achievement.category].color,
              backgroundImage: achievement.unlocked
                ? undefined
                : `repeating-linear-gradient(90deg, ${CATEGORY_META[achievement.category].color} 0 3px, rgba(0,0,0,0.25) 3px 4px)`,
            }} />
          </div>
        </div>
      )}
      {achievement.unlocked && achievement.target <= 1 && (
        <div style={{ fontSize: 8, color: 'var(--color-success)', fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Débloqué
        </div>
      )}
    </div>
  )
}

const CATEGORY_META: Record<Achievement['category'], { label: string; color: string }> = {
  paint: { label: 'Peinture', color: 'var(--color-success)' },
  collection: { label: 'Collection', color: 'var(--color-accent)' },
  factions: { label: 'Factions', color: 'var(--color-warning)' },
  lists: { label: 'Listes', color: 'var(--color-magenta)' },
  social: { label: 'Social', color: 'var(--color-gold)' },
}

function AchievementsGrid() {
  const achievements = useAchievements()
  const [activeId, setActiveId] = useState<string | null>(null)
  const badgeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  const handleClose = useCallback(() => setActiveId(null), [])

  const activeAchievement = activeId ? achievements.find((a) => a.id === activeId) : null

  // Group by category preserving order
  const groups = useMemo(() => {
    const ordered: AchievementCategory[] = ['paint', 'collection', 'factions', 'lists', 'social']
    return ordered
      .map((cat) => ({ category: cat, ...CATEGORY_META[cat], items: achievements.filter((a) => a.category === cat) }))
      .filter((g) => g.items.length > 0)
  }, [achievements])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((group) => {
          const done = group.items.filter((a) => a.unlocked).length
          return (
            <div key={group.category}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 14, background: group.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: group.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  {group.label}
                </span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {done}/{group.items.length}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
              {/* Badges row */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.items.length, 3)}, 1fr)`, gap: 8 }}>
                {group.items.map((a) => {
                  const progressPct = a.target > 1 ? Math.round((a.current / a.target) * 100) : 0
                  const catColor = group.color
                  return (
                    <div
                      key={a.id}
                      ref={(el) => { badgeRefs.current[a.id] = el }}
                      onClick={() => setActiveId(activeId === a.id ? null : a.id)}
                      onMouseEnter={() => {
                        hoverTimeout.current = setTimeout(() => setActiveId(a.id), 200)
                      }}
                      onMouseLeave={() => {
                        if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                        setActiveId(null)
                      }}
                      style={{
                        borderLeft: `3px solid ${a.unlocked ? catColor : 'var(--color-border)'}`,
                        border: `1px solid ${a.unlocked ? catColor : 'var(--color-border)'}`,
                        borderLeftWidth: 3,
                        background: a.unlocked ? `color-mix(in srgb, ${catColor} 6%, transparent)` : 'var(--color-surface)',
                        padding: '10px 6px 8px',
                        textAlign: 'center',
                        opacity: a.unlocked ? 1 : 0.5,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 20, lineHeight: 1 }}>{a.icon}</div>
                      <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: a.unlocked ? catColor : 'var(--color-text-muted)', letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' }}>
                        {a.label}
                      </div>
                      {a.target > 1 && (
                        <div style={{ marginTop: 6, padding: '0 4px' }}>
                          <div style={{ height: 4, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPct}%`,
                              background: a.unlocked ? catColor : catColor,
                              backgroundImage: a.unlocked
                                ? undefined
                                : `repeating-linear-gradient(90deg, ${catColor} 0 3px, rgba(0,0,0,0.25) 3px 4px)`,
                            }} />
                          </div>
                          <div style={{ fontSize: 7, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {a.current}/{a.target}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {activeAchievement && badgeRefs.current[activeAchievement.id] && (
        <BadgeTooltip
          achievement={activeAchievement}
          anchorRef={{ current: badgeRefs.current[activeAchievement.id] }}
          onClose={handleClose}
        />
      )}
    </>
  )
}

function PaintDonut({ size = 120 }: { size?: number }) {
  const getProgressStats = useCollectionStore((s) => s.getProgressStats)
  const stats = getProgressStats()
  const total = stats.total || 1
  const segments = [
    { value: stats.completed, color: 'var(--color-success)' },
    { value: stats.inProgress, color: 'var(--color-accent)' },
    { value: stats.assembled, color: 'var(--color-warning)' },
    { value: stats.unassembled, color: '#536577' },
  ]

  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={10} />
      {segments.map((seg, i) => {
        const pct = seg.value / total
        const dash = pct * circumference
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="var(--color-accent)" fontFamily="var(--font-mono)" fontSize={22} fontWeight={700}>
        {stats.percentComplete}%
      </text>
    </svg>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { exportData, importData } = useExportImport()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profile = useFriendsStore((s) => s.profile)
  const loadFactionIndex = useGameDataStore((s) => s.loadFactionIndex)
  useEffect(() => { loadFactionIndex() }, [loadFactionIndex])

  const collectionItems = useCollectionStore((s) => s.items)
  const collectionCount = Object.keys(collectionItems).length
  const listsCount = Object.keys(useListsStore((s) => s.lists)).length
  const colorVisionMode = usePreferencesStore((s) => s.colorVisionMode)
  const setColorVisionMode = usePreferencesStore((s) => s.setColorVisionMode)
  const favoriteFactionSlug = usePreferencesStore((s) => s.favoriteFactionSlug)
  const setFavoriteFaction = usePreferencesStore((s) => s.setFavoriteFaction)
  const showCalculatorFab = usePreferencesStore((s) => s.showCalculatorFab)
  const setShowCalculatorFab = usePreferencesStore((s) => s.setShowCalculatorFab)
  const factionIndex = useGameDataStore((s) => s.factionIndex)
  const factions: FactionSummary[] = factionIndex?.factions ?? []
  const favoriteFactionName = favoriteFactionSlug ? factions.find((f) => f.slug === favoriteFactionSlug)?.name ?? null : null
  const [factionPickerOpen, setFactionPickerOpen] = useState(false)

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
    <>
      {/* ══════ DESKTOP HUD ══════ */}
      <div className="hidden lg:block">
        <HudTopBar title="Profil" sub="Commandant" />
        <div style={{ padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AuthSection />

            <HudPanel title="Données">
              <div style={{ padding: 16, display: 'flex', gap: 24 }}>
                <HudStat label="Collection" value={collectionCount} unit={collectionCount !== 1 ? 'unités' : 'unité'} />
                <HudStat label="Listes" value={listsCount} unit={listsCount !== 1 ? 'listes' : 'liste'} />
              </div>
            </HudPanel>

            {isAuthenticated && (
              <HudPanel title="Parties">
                <div style={{ padding: 12 }}>
                  <button
                    style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-accent)', padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', letterSpacing: 0.5 }}
                    onClick={() => navigate('/profile/history')}
                  >
                    HISTORIQUE DES PARTIES {'\u25b8'}
                  </button>
                </div>
              </HudPanel>
            )}

            <HudPanel title="Badges">
              <div style={{ padding: 12 }}>
                <AchievementsGrid />
              </div>
            </HudPanel>

            <div style={{ padding: '12px 16px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>PierreHammer</div>
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Companion Warhammer 40K {'\u00b7'} Par Thomas pour Pierre
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HudPanel title="Préférences">
              <div style={{ padding: 12 }}>
                {/* Favorite faction toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: favoriteFactionSlug ? 8 : 0 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>Faction favorite</div>
                    <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Ouvre le Codex directement sur ta faction
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (favoriteFactionSlug) {
                        setFavoriteFaction(null)
                      } else {
                        setFactionPickerOpen(true)
                      }
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                      backgroundColor: favoriteFactionSlug ? 'var(--color-accent)' : 'var(--color-border)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 8,
                      backgroundColor: 'var(--color-bg)', transition: 'left 0.2s',
                      left: favoriteFactionSlug ? 18 : 2,
                    }} />
                  </button>
                </div>
                {favoriteFactionSlug && favoriteFactionName && (
                  <button
                    onClick={() => setFactionPickerOpen(true)}
                    style={{
                      width: '100%', padding: '8px 12px', textAlign: 'left', cursor: 'pointer',
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                      border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <T text={favoriteFactionName} category="faction" />
                    <span style={{ float: 'right', fontSize: 9, color: 'var(--color-text-muted)' }}>Changer</span>
                  </button>
                )}

                {/* Calculator FAB toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>Calculateur rapide</div>
                    <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Bouton flottant sur toutes les pages
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCalculatorFab(!showCalculatorFab)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                      backgroundColor: showCalculatorFab ? 'var(--color-accent)' : 'var(--color-border)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 8,
                      backgroundColor: 'var(--color-bg)', transition: 'left 0.2s',
                      left: showCalculatorFab ? 18 : 2,
                    }} />
                  </button>
                </div>
              </div>
            </HudPanel>

            <HudPanel title="Accessibilité">
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  Adapte les couleurs pour les daltoniens
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {COLOR_VISION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: colorVisionMode === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                        border: `1px solid ${colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        color: colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-text-dim)',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                      }}
                      onClick={() => setColorVisionMode(opt.value)}
                    >
                      <span style={{ width: 10, height: 10, border: `2px solid ${colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-text-muted)'}`, background: colorVisionMode === opt.value ? 'var(--color-accent)' : 'transparent', flexShrink: 0 }} />
                      <span>
                        <span style={{ fontSize: 12, fontWeight: 500, display: 'block' }}>{opt.label}</span>
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{opt.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </HudPanel>

            <HudPanel title="Sauvegarde">
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer', textTransform: 'uppercase' as const }}
                    onClick={exportData}
                  >
                    Exporter
                  </button>
                  <button
                    style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer', textTransform: 'uppercase' as const }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Importer
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} aria-label="Importer un fichier JSON" />
                <p style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  L'import remplace toutes les données existantes.
                </p>
              </div>
            </HudPanel>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE HUD ══════ */}
      <div className="lg:hidden">
        <MTopBar title="Profil" sub="Commandant" />
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Identity sigil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--color-accent)',
            }}>
              {(profile?.username || 'C')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                {profile?.username || 'Commandant'}
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                {collectionCount} unités {'\u00b7'} {listsCount} listes
              </div>
            </div>
          </div>

          {/* Donut SVG */}
          {collectionCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PaintDonut size={120} />
            </div>
          )}

          {/* Auth */}
          <AuthSection />

          {isAuthenticated && (
            <HudBtn variant="ghost" onClick={() => navigate('/profile/history')} style={{ width: '100%', justifyContent: 'center' }}>
              HISTORIQUE DES PARTIES {'\u25b8'}
            </HudBtn>
          )}

          {/* Achievements */}
          <MSection>Badges</MSection>
          <AchievementsGrid />

          {/* Favorite faction */}
          <MSection>Préférences</MSection>
          <div style={{ padding: '10px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: favoriteFactionSlug ? 8 : 0 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>Faction favorite</div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Ouvre le Codex directement sur ta faction
                </div>
              </div>
              <button
                onClick={() => {
                  if (favoriteFactionSlug) {
                    setFavoriteFaction(null)
                  } else {
                    setFactionPickerOpen(true)
                  }
                }}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                  backgroundColor: favoriteFactionSlug ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background-color 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 8,
                  backgroundColor: 'var(--color-bg)', transition: 'left 0.2s',
                  left: favoriteFactionSlug ? 18 : 2,
                }} />
              </button>
            </div>
            {favoriteFactionSlug && favoriteFactionName && (
              <button
                onClick={() => setFactionPickerOpen(true)}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left', cursor: 'pointer',
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                  border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                }}
              >
                <T text={favoriteFactionName} category="faction" />
                <span style={{ float: 'right', fontSize: 9, color: 'var(--color-text-muted)' }}>Changer</span>
              </button>
            )}

            {/* Calculator FAB toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>Calculateur rapide</div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Bouton flottant sur toutes les pages
                </div>
              </div>
              <button
                onClick={() => setShowCalculatorFab(!showCalculatorFab)}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                  backgroundColor: showCalculatorFab ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background-color 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 8,
                  backgroundColor: 'var(--color-bg)', transition: 'left 0.2s',
                  left: showCalculatorFab ? 18 : 2,
                }} />
              </button>
            </div>
          </div>

          {/* Accessibility */}
          <MSection>Accessibilité</MSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {COLOR_VISION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: colorVisionMode === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                  border: `1px solid ${colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-text-dim)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onClick={() => setColorVisionMode(opt.value)}
              >
                <span style={{ width: 10, height: 10, border: `2px solid ${colorVisionMode === opt.value ? 'var(--color-accent)' : 'var(--color-text-muted)'}`, background: colorVisionMode === opt.value ? 'var(--color-accent)' : 'transparent', flexShrink: 0 }} />
                <span>
                  <span style={{ fontSize: 12, fontWeight: 500, display: 'block' }}>{opt.label}</span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{opt.description}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Export/Import */}
          <MSection>Sauvegarde</MSection>
          <div style={{ display: 'flex', gap: 8 }}>
            <HudBtn variant="ghost" onClick={exportData} style={{ flex: 1, justifyContent: 'center' }}>EXPORTER</HudBtn>
            <HudBtn variant="ghost" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, justifyContent: 'center' }}>IMPORTER</HudBtn>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} aria-label="Importer un fichier JSON" />
          <p style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            L'import remplace toutes les données existantes.
          </p>

          {/* About */}
          <div style={{ padding: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>PierreHammer</div>
            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Companion Warhammer 40K {'\u00b7'} Par Thomas pour Pierre
            </div>
          </div>
        </div>
      </div>
      {/* Faction picker modal */}
      {factionPickerOpen && (
        <div data-scroll-lock className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setFactionPickerOpen(false)}>
          <div
            className="w-full max-w-md p-5 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              {'\u25b8'} Choisir ta faction favorite
            </div>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
              {factions.map((faction) => (
                <button
                  key={faction.id}
                  onClick={() => {
                    setFavoriteFaction(faction.slug)
                    setFactionPickerOpen(false)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    backgroundColor: faction.slug === favoriteFactionSlug ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: `1px solid ${faction.slug === favoriteFactionSlug ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    cursor: 'pointer', fontSize: 11, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <T text={faction.name} category="faction" />
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setFactionPickerOpen(false)}
              style={{
                marginTop: 16, width: '100%', textAlign: 'center', fontSize: 10,
                background: 'transparent', border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)', cursor: 'pointer', padding: '6px 0',
                fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
