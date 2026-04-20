import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB-based custom image store (not available in jsdom)
vi.mock('@/stores/customImageStore', () => ({
  getCustomImageUrl: vi.fn().mockResolvedValue(null),
  saveCustomImage: vi.fn().mockResolvedValue('blob:mock'),
  deleteCustomImage: vi.fn().mockResolvedValue(undefined),
  hasCustomImage: vi.fn().mockResolvedValue(false),
  exportAllCustomImages: vi.fn().mockResolvedValue({}),
  importAllCustomImages: vi.fn().mockResolvedValue(undefined),
  clearAllCustomImages: vi.fn().mockResolvedValue(undefined),
}))
