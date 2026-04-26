import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { usePointsHistoryStore } from '@/stores/pointsHistoryStore'
import { HudPanel, HudStat, HudSegmentedBar, HudBar, MTopBar, MSection, MQuickCard } from '@/components/ui/Hud'
import { useFriendsStore } from '@/stores/friendsStore'
import { useAuthStore } from '@/stores/authStore'

function useCollectionByFaction() {
  const items = useCollectionStore((s) => s.items)
  const factionIndex = useGameDataStore((s) => s.factionIndex)

  return useMemo(() => {
    const byFaction: Record<string, { total: number; done: number; inProgress: number; assembled: number; unassembled: number }> = {}
    for (const item of Object.values(items)) {
      const fid = item.factionId
      if (!byFaction[fid]) byFaction[fid] = { total: 0, done: 0, inProgress: 0, assembled: 0, unassembled: 0 }
      for (const inst of item.instances) {
        byFaction[fid].total++
        if (inst === 'done') byFaction[fid].done++
        else if (inst === 'in-progress') byFaction[fid].inProgress++
        else if (inst === 'assembled') byFaction[fid].assembled++
        else byFaction[fid].unassembled++
      }
    }
    const rows = Object.entries(byFaction)
      .map(([factionId, stats]) => {
        const faction = factionIndex?.factions.find((f) => f.id === factionId || f.slug === factionId)
        return { factionId, name: faction?.name || factionId, ...stats }
      })
      .sort((a, b) => b.total - a.total)
    return rows
  }, [items, factionIndex])
}

export function DashboardPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profile = useFriendsStore((s) => s.profile)
  const collectionItems = useCollectionStore((s) => s.items)
  const getProgressStats = useCollectionStore((s) => s.getProgressStats)
  const stats = useMemo(() => getProgressStats(), [collectionItems, getProgressStats])
  const listsMap = useListsStore((s) => s.lists)
  const getAllLists = useListsStore((s) => s.getAllLists)
  const lists = useMemo(() => getAllLists(), [listsMap, getAllLists])
  const favCount = useFavoritesStore((s) => s.favorites.length)
  const loadFactionIndex = useGameDataStore((s) => s.loadFactionIndex)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const factionIndex = useGameDataStore((s) => s.factionIndex)
  const factionRows = useCollectionByFaction()
  const diffs = usePointsHistoryStore((s) => s.diffs)

  useEffect(() => { loadFactionIndex() }, [loadFactionIndex])

  // Load factions that have owned units or point diffs (for name resolution)
  useEffect(() => {
    const needed = new Set(Object.values(collectionItems).map((i) => i.factionId))
    for (const slug of Object.keys(diffs)) needed.add(slug)
    for (const slug of needed) {
      if (!loadedFactions[slug]) loadFaction(slug)
    }
  }, [collectionItems, diffs, loadedFactions, loadFaction])

  // Workshop units: any unit with at least one non-done instance
  const workshopUnits = useMemo(() => {
    const statusPriority = { 'in-progress': 0, 'assembled': 1, 'unassembled': 2 } as const
    return Object.entries(collectionItems)
      .filter(([, item]) => item.instances.some((s) => s !== 'done'))
      .map(([id, item]) => {
        const pending = item.instances.filter((s) => s !== 'done')
        const bestStatus = pending.sort(
          (a, b) => (statusPriority[a as keyof typeof statusPriority] ?? 9) - (statusPriority[b as keyof typeof statusPriority] ?? 9)
        )[0]
        // Resolve name + image from loaded faction datasheets
        const faction = loadedFactions[item.factionId]
        const ds = faction?.datasheets?.find((d) => d.id === id)
        const name = ds?.name ?? id.substring(0, 14)
        const imageUrl = ds?.imageUrl
        return { id, factionId: item.factionId, name, imageUrl, status: bestStatus, pendingCount: pending.length }
      })
      .sort((a, b) => (statusPriority[a.status as keyof typeof statusPriority] ?? 9) - (statusPriority[b.status as keyof typeof statusPriority] ?? 9))
      .slice(0, 12)
  }, [collectionItems, loadedFactions])

  // Points changes from last update (no expiration — always show last known diffs)
  const { pointsChanges, pointsChangesDate } = useMemo(() => {
    const changes: { id: string; name: string; factionName: string; factionSlug: string; delta: number }[] = []
    let latestDate: string | null = null
    for (const [slug, diff] of Object.entries(diffs)) {
      if (!latestDate || diff.detectedAt > latestDate) latestDate = diff.detectedAt
      const faction = loadedFactions[slug]
      for (const [unitId, delta] of Object.entries(diff.changes)) {
        const ds = faction?.datasheets?.find((d) => d.id === unitId)
        const name = ds?.name ?? unitId.substring(0, 20)
        const factionName = faction?.name ?? slug
        changes.push({ id: unitId, name, factionName, factionSlug: slug, delta })
      }
    }
    changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    return { pointsChanges: changes, pointsChangesDate: latestDate }
  }, [diffs, loadedFactions])

  // WarCom news feed
  const [warcomArticles, setWarcomArticles] = useState<{ id: string; url: string; title: string; summary: string; image: string; date_published: string; tags?: string[] }[]>([])
  useEffect(() => {
    const isDev = import.meta.env.DEV
    const url = isDev
      ? '/api/warcom/feed.json'
      : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://warcomfeed.link/feed.json')
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data?.items) setWarcomArticles(data.items.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  const username = isAuthenticated && profile?.username ? profile.username : 'Commandant'

  const recentLists = lists.slice(0, 4)
  const factionCount = factionIndex?.factions.length || 0

  return (
    <>
    {/* ── MOBILE: HUD landing ── */}
    <div className="lg:hidden">
      <MTopBar title={`Bienvenue, ${username}`} sub="Commandement" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <KpiCard label="Total" value={stats.total} color="var(--color-accent)" />
          <KpiCard label="En cours" value={stats.inProgress} color="var(--color-accent)" />
          <KpiCard label="Terminées" value={stats.completed} color="var(--color-success)" sub={stats.total > 0 ? `${stats.percentComplete}%` : undefined} />
        </div>

        {/* Segmented bar + legend */}
        {stats.total > 0 && (
          <div>
            <HudSegmentedBar
              height={6}
              segments={[
                { value: stats.completed, color: 'var(--color-success)' },
                { value: stats.inProgress, color: 'var(--color-accent)' },
                { value: stats.assembled, color: 'var(--color-warning)' },
                { value: stats.unassembled, color: '#536577' },
              ]}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <PaintLegend color="var(--color-success)" label="Peint" count={stats.completed} />
              <PaintLegend color="var(--color-accent)" label="En cours" count={stats.inProgress} />
              <PaintLegend color="var(--color-warning)" label="Assemblé" count={stats.assembled} />
              <PaintLegend color="#536577" label="Non monté" count={stats.unassembled} />
            </div>
          </div>
        )}

        {/* Quick access */}
        <MSection>Accès rapides</MSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MQuickCard icon={'\u25c8'} label="Collection" sub={`${stats.total} figurines`} onClick={() => navigate('/collection')} />
          <MQuickCard icon={'\u2637'} label="Catalogue" sub={`${factionCount} factions`} onClick={() => navigate('/catalog')} />
          <MQuickCard icon={'\u25a4'} label="Mes Listes" sub={`${lists.length} listes`} onClick={() => navigate('/lists')} />
          <MQuickCard icon={'\u2694'} label="Simulateur" sub="Calcul proba" onClick={() => navigate('/simulate')} />
        </div>

        {/* En atelier — units not fully painted */}
        {workshopUnits.length > 0 && (
          <>
            <MSection>En atelier</MSection>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {workshopUnits.map((u) => {
                const statusColor =
                  u.status === 'in-progress' ? 'var(--color-accent)'
                    : u.status === 'assembled' ? 'var(--color-warning)'
                      : '#536577'
                const statusLabel =
                  u.status === 'in-progress' ? 'EN COURS'
                    : u.status === 'assembled' ? 'ASSEMBLÉ'
                      : 'NON MONTÉ'
                return (
                  <div
                    key={u.id}
                    onClick={() => navigate('/collection')}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `3px solid ${statusColor}`,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {u.imageUrl && (
                      <div style={{ width: 64, height: 64, flexShrink: 0, overflow: 'hidden' }}>
                        <img src={u.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </div>
                    )}
                    <div style={{ padding: '8px 10px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{u.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <span style={{ fontSize: 9, color: statusColor, fontFamily: 'var(--font-mono)', letterSpacing: 0.3 }}>{statusLabel}</span>
                        {u.pendingCount > 1 && (
                          <span style={{ fontSize: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>x{u.pendingCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Dernières modifs de points */}
        <MSection>Dernières modifs</MSection>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {pointsChangesDate && (
            <div style={{ padding: '6px 12px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', letterSpacing: 0.5 }}>
              MAJ {new Date(pointsChangesDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          {pointsChanges.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              Aucun changement de points récent
            </div>
          ) : (
            <>
              {pointsChanges.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/catalog/${c.factionSlug}/${c.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{c.factionName}</div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: c.delta > 0 ? 'var(--color-error)' : 'var(--color-success)',
                  }}>
                    {c.delta > 0 ? `+${c.delta}` : c.delta}
                  </span>
                </div>
              ))}
              {pointsChanges.length > 8 && (
                <div style={{ padding: '6px 12px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  +{pointsChanges.length - 8} autres changements
                </div>
              )}
            </>
          )}
        </div>
        {/* WarCom News */}
        {warcomArticles.length > 0 && (
          <>
            <MSection>Actu WarCom</MSection>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {warcomArticles.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    gap: 10,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {a.image && (
                    <div style={{ width: 80, height: 64, flexShrink: 0, overflow: 'hidden' }}>
                      <img src={a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ padding: '8px 10px 8px 0', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>{new Date(a.date_published).toLocaleDateString('fr-FR')}</span>
                      {a.tags?.[0] && <span style={{ color: 'var(--color-accent)' }}>{a.tags[0]}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>

    {/* ── DESKTOP: full HUD dashboard ── */}
    <div className="hidden lg:block" style={{ padding: '0 28px 28px' }}>
      {/* ── HERO BANNER ── */}
      <div style={{ padding: '32px 0 24px' }}>
        <div style={{ fontSize: 9, color: 'var(--color-accent)', letterSpacing: 2.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const }}>
          {'\u25b8'} Commandement
        </div>
        <div style={{ fontSize: 28, color: 'var(--color-text)', fontWeight: 700, letterSpacing: -0.5, marginTop: 4 }}>
          Tableau de Bord
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          {factionCount} factions {'\u00b7'} {stats.total} figurines {'\u00b7'} {lists.length} listes
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Figurines" value={stats.total} color="var(--color-accent)" />
        <KpiCard label="Peintes" value={stats.completed} color="var(--color-success)" sub={stats.total > 0 ? `${stats.percentComplete}%` : undefined} />
        <KpiCard label="Listes" value={lists.length} color="var(--color-gold)" />
        <KpiCard label="Favoris" value={favCount} color="var(--color-magenta)" />
      </div>

      {/* ── MAIN GRID: 2 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Faction Breakdown */}
          <HudPanel title="Factions">
            {factionRows.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' as const, color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                Aucune figurine dans la collection
              </div>
            ) : (
              <div style={{ padding: '2px 0' }}>
                {/* Header */}
                <div style={{ display: 'flex', padding: '6px 12px', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ flex: 1 }}>Faction</span>
                  <span style={{ width: 50, textAlign: 'right' as const }}>Total</span>
                  <span style={{ width: 50, textAlign: 'right' as const }}>Peint</span>
                  <span style={{ width: 100, textAlign: 'right' as const }}>Progression</span>
                </div>
                {factionRows.map((row) => {
                  const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0
                  return (
                    <div
                      key={row.factionId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/catalog/${row.factionId}`)}
                    >
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {row.name}
                      </span>
                      <span style={{ width: 50, textAlign: 'right' as const, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-dim)' }}>
                        {row.total}
                      </span>
                      <span style={{ width: 50, textAlign: 'right' as const, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-success)' }}>
                        {row.done}
                      </span>
                      <div style={{ width: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <HudBar value={pct} max={100} color="var(--color-accent)" width={60} height={3} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', width: 26, textAlign: 'right' as const }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </HudPanel>

          {/* Quick Access */}
          <HudPanel title="Accès Rapide">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--color-border)' }}>
              <QuickLink icon="◈" label="Collection" sub={`${stats.total} figurines`} onClick={() => navigate('/collection')} />
              <QuickLink icon="▤" label="Mes Listes" sub={`${lists.length} listes`} onClick={() => navigate('/lists')} />
              <QuickLink icon="☷" label="Catalogue" sub={`${factionCount} factions`} onClick={() => navigate('/catalog')} />
              <QuickLink icon="⚔" label="Simulateur" sub="Calcul de probabilités" onClick={() => navigate('/simulate')} />
            </div>
          </HudPanel>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Paint Progression */}
          <HudPanel title="Progression Peinture">
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <HudStat label="Complétion" value={`${stats.percentComplete}%`} color="var(--color-accent)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-dim)' }}>
                  {stats.completed}/{stats.total}
                </span>
              </div>
              <HudSegmentedBar
                height={10}
                segments={[
                  { value: stats.completed, color: 'var(--color-success)' },
                  { value: stats.inProgress, color: 'var(--color-accent)' },
                  { value: stats.assembled, color: 'var(--color-warning)' },
                  { value: stats.unassembled, color: '#536577' },
                ]}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <PaintLegend color="var(--color-success)" label="Peint" count={stats.completed} />
                <PaintLegend color="var(--color-accent)" label="En cours" count={stats.inProgress} />
                <PaintLegend color="var(--color-warning)" label="Assemblé" count={stats.assembled} />
                <PaintLegend color="#536577" label="Non assemblé" count={stats.unassembled} />
              </div>
            </div>
          </HudPanel>

          {/* Recent Lists */}
          <HudPanel title="Listes Récentes">
            {recentLists.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' as const, color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                Aucune liste créée
              </div>
            ) : (
              <div>
                {recentLists.map((list) => {
                  const usedPts = list.units.reduce((sum, u) => sum + u.points + (u.enhancement?.cost || 0), 0)
                  return (
                    <div
                      key={list.id}
                      onClick={() => navigate(`/lists/${list.id}`)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {list.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {list.detachment} {'\u00b7'} {list.units.length} unités
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: usedPts > list.pointsLimit ? 'var(--color-error)' : 'var(--color-accent)' }}>
                          {usedPts}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                          /{list.pointsLimit}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {lists.length > 4 && (
                  <div
                    onClick={() => navigate('/lists')}
                    style={{ padding: '8px 14px', textAlign: 'center' as const, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', cursor: 'pointer', letterSpacing: 1 }}
                  >
                    VOIR TOUTES LES LISTES {'\u25b8'}
                  </div>
                )}
              </div>
            )}
          </HudPanel>

          {/* Points Changes */}
          <HudPanel title={pointsChangesDate ? `Dernières Modifs — ${new Date(pointsChangesDate).toLocaleDateString('fr-FR')}` : 'Dernières Modifs'}>
            {pointsChanges.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' as const, color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                Aucun changement de points récent
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', padding: '6px 12px', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ flex: 1 }}>Unité</span>
                  <span style={{ width: 60, textAlign: 'right' as const }}>Delta</span>
                </div>
                {pointsChanges.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/catalog/${c.factionSlug}/${c.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{c.factionName}</div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: c.delta > 0 ? 'var(--color-error)' : 'var(--color-success)',
                      width: 60,
                      textAlign: 'right' as const,
                    }}>
                      {c.delta > 0 ? `+${c.delta}` : c.delta} pts
                    </span>
                  </div>
                ))}
                {pointsChanges.length > 10 && (
                  <div style={{ padding: '8px 12px', textAlign: 'center' as const, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                    +{pointsChanges.length - 10} AUTRES CHANGEMENTS
                  </div>
                )}
              </div>
            )}
          </HudPanel>

          {/* WarCom News */}
          {warcomArticles.length > 0 && (
            <HudPanel title="Actu WarCom">
              <div>
                {warcomArticles.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--color-border)',
                      gap: 12,
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    {a.image && (
                      <div style={{ width: 72, height: 48, flexShrink: 0, overflow: 'hidden' }}>
                        <img src={a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.summary}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>{new Date(a.date_published).toLocaleDateString('fr-FR')}</span>
                        {a.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} style={{ color: 'var(--color-accent)', fontSize: 8, letterSpacing: 0.5 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </HudPanel>
          )}
        </div>
      </div>

    </div>
    </>
  )
}

function KpiCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color, lineHeight: 1, fontFamily: 'var(--font-sans)' }}>
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

function PaintLegend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        {count}
      </span>
    </div>
  )
}

function QuickLink({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 16px',
        background: 'var(--color-surface)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' as const, color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-accent)' }}>
        {icon}
      </span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}
