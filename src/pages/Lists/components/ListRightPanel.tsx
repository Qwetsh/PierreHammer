import { useMemo } from 'react'
import type { ArmyList } from '@/types/armyList.types'
import type { Faction, Detachment, Stratagem } from '@/types/gameData.types'
import type { CollectionItem } from '@/types/collection.types'
import { MSection } from '@/components/ui/Hud'
import { T } from '@/components/ui/TranslatableText'

export function StratagemCard({ stratagem }: { stratagem: Stratagem }) {
  const typeColor =
    stratagem.type.toLowerCase().includes('battle tactic')
      ? 'var(--color-accent)'
      : stratagem.type.toLowerCase().includes('epic')
        ? 'var(--color-purple)'
        : 'var(--color-gold)'

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '10px 12px',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: '#fff',
            background: typeColor,
            flexShrink: 0,
          }}
        >
          {stratagem.cpCost}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
            <T text={stratagem.name} category="stratagem" />
          </div>
          <div
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              color: typeColor,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {stratagem.type}
          </div>
          {stratagem.legend && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              <T text={stratagem.legend} category="stratagem" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface AnalysisStats {
  totalModels: number
  averageRange: string
  totalOC: number
  totalWounds: number
  paintedPercent: number
}

function computeAnalysis(
  list: ArmyList,
  faction: Faction | undefined,
  collectionItems: Record<string, CollectionItem>,
): AnalysisStats {
  let totalModels = 0
  let totalWounds = 0
  let totalOC = 0
  let rangeSum = 0
  let rangeCount = 0
  let paintedCount = 0
  let totalInstances = 0

  for (const unit of list.units) {
    const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
    if (!ds) continue

    // Models count from selected point option
    const optIdx = unit.selectedPointOptionIndex ?? 0
    const modelsStr = ds.pointOptions[optIdx]?.models ?? ds.pointOptions[0]?.models ?? '1'
    const models = parseInt(modelsStr, 10) || 1
    totalModels += models

    // Stats from profiles
    for (const profile of ds.profiles) {
      const w = parseInt(profile.W, 10) || 0
      const oc = parseInt(profile.OC, 10) || 0
      totalWounds += w * models
      totalOC += oc * models
    }

    // Average range from ranged weapons
    for (const weapon of ds.weapons) {
      if (weapon.type.toLowerCase() === 'ranged' && weapon.range) {
        const r = parseInt(weapon.range.replace(/"/g, ''), 10)
        if (!isNaN(r) && r > 0) {
          rangeSum += r
          rangeCount++
        }
      }
    }

    // Paint status from collection
    const item = collectionItems[unit.datasheetId]
    if (item?.squads) {
      for (const status of item.squads.flat()) {
        totalInstances++
        if (status === 'done') paintedCount++
      }
    }
  }

  const avgRange = rangeCount > 0 ? Math.round(rangeSum / rangeCount) : 0
  const paintedPercent = totalInstances > 0 ? Math.round((paintedCount / totalInstances) * 100) : 0

  return {
    totalModels,
    averageRange: avgRange > 0 ? `${avgRange}"` : '-',
    totalOC,
    totalWounds,
    paintedPercent,
  }
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

export function ListRightPanel({
  list,
  faction,
  collectionItems,
}: {
  list: ArmyList
  faction: Faction | undefined
  collectionItems: Record<string, CollectionItem>
}) {
  const detachment: Detachment | undefined = faction?.detachments?.find(
    (d) => d.id === list.detachmentId || d.name === list.detachment,
  )

  const stratagems = detachment?.stratagems ?? []

  const analysis = useMemo(
    () => computeAnalysis(list, faction, collectionItems),
    [list, faction, collectionItems],
  )

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Stratagems — scrollable */}
      {stratagems.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px 12px 14px' }}>
          <MSection>Stratagemes ({stratagems.length})</MSection>
          <div style={{ marginTop: 8 }}>
            {stratagems.map((s) => (
              <StratagemCard key={s.id} stratagem={s} />
            ))}
          </div>
        </div>
      )}

      {/* Analysis — always visible */}
      <div style={{ flexShrink: 0, padding: '12px 16px 12px 14px', borderTop: '1px solid var(--color-border)' }}>
        <MSection>Analyse</MSection>
        <div
          style={{
            marginTop: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <StatRow label="Total modeles" value={analysis.totalModels} />
          <StatRow label="Portee moyenne" value={analysis.averageRange} />
          <StatRow label="Capacite objectifs" value={`${analysis.totalOC} OC`} />
          <StatRow label="Wounds total" value={analysis.totalWounds} />
          <StatRow label="Peints pour jouer" value={`${analysis.paintedPercent}%`} />
        </div>
      </div>
    </div>
  )
}
