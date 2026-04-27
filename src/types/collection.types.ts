import type { PaintStatus } from '@/components/domain/PaintStatusBadge'

export interface CollectionItem {
  datasheetId: string
  factionId: string
  /** Each sub-array is a squad/set of individual miniatures with their own paint status */
  squads: PaintStatus[][]
}
