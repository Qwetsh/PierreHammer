import { validateExportData } from './storageValidator'

describe('storageValidator', () => {
  it('accepts valid export data', () => {
    const data = {
      version: 1,
      exportedAt: '2026-04-01',
      collection: {
        'ds-1': { datasheetId: 'ds-1', factionId: 'f-1', quantity: 1, paintStatus: 'done' },
      },
      lists: {
        'l-1': { id: 'l-1', name: 'Test', factionId: 'f-1', units: [] },
      },
    }
    expect(validateExportData(data)).toEqual({ valid: true, errors: [] })
  })

  it('rejects non-object', () => {
    const result = validateExportData('not an object')
    expect(result.valid).toBe(false)
  })

  it('rejects wrong version', () => {
    const result = validateExportData({ version: 2 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Version de format non supportée.')
  })

  it('rejects collection item missing datasheetId', () => {
    const data = {
      version: 1,
      collection: { 'ds-1': { quantity: 1, paintStatus: 'done' } },
    }
    const result = validateExportData(data)
    expect(result.valid).toBe(false)
  })

  it('rejects list missing name', () => {
    const data = {
      version: 1,
      lists: { 'l-1': { id: 'l-1', factionId: 'f-1', units: [] } },
    }
    const result = validateExportData(data)
    expect(result.valid).toBe(false)
  })

  it('accepts empty collections and lists', () => {
    const data = { version: 1, collection: {}, lists: {} }
    expect(validateExportData(data).valid).toBe(true)
  })
})
