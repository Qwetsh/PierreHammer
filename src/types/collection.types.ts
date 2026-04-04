import type { PaintStatus } from '@/components/domain/PaintStatusBadge'

export interface CollectionItem {
  datasheetId: string
  factionId: string
  instances: PaintStatus[]
}
