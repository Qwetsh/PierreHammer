import type { PaintStatus } from '@/components/domain/PaintStatusBadge'

export interface CollectionItem {
  datasheetId: string
  factionId: string
  quantity: number
  paintStatus: PaintStatus
}
