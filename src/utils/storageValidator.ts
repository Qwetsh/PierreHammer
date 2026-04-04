export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateExportData(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Le fichier ne contient pas un objet JSON valide.'] }
  }

  const obj = data as Record<string, unknown>

  if (obj.version !== 1) {
    errors.push('Version de format non supportée.')
  }

  // Validate collection
  if (obj.collection !== undefined) {
    if (typeof obj.collection !== 'object' || obj.collection === null) {
      errors.push('La collection doit être un objet.')
    } else {
      const items = obj.collection as Record<string, unknown>
      for (const [key, item] of Object.entries(items)) {
        if (!item || typeof item !== 'object') {
          errors.push(`Collection item "${key}" invalide.`)
          continue
        }
        const ci = item as Record<string, unknown>
        if (typeof ci.datasheetId !== 'string') errors.push(`Collection item "${key}": datasheetId manquant.`)
        if (typeof ci.quantity !== 'number') errors.push(`Collection item "${key}": quantity manquante.`)
        if (typeof ci.paintStatus !== 'string') {
          errors.push(`Collection item "${key}": paintStatus manquant.`)
        } else if (!['unassembled', 'assembled', 'in-progress', 'done'].includes(ci.paintStatus)) {
          errors.push(`Collection item "${key}": paintStatus invalide "${ci.paintStatus}".`)
        }
      }
    }
  }

  // Validate lists
  if (obj.lists !== undefined) {
    if (typeof obj.lists !== 'object' || obj.lists === null) {
      errors.push('Les listes doivent être un objet.')
    } else {
      const lists = obj.lists as Record<string, unknown>
      for (const [key, list] of Object.entries(lists)) {
        if (!list || typeof list !== 'object') {
          errors.push(`Liste "${key}" invalide.`)
          continue
        }
        const al = list as Record<string, unknown>
        if (typeof al.id !== 'string') errors.push(`Liste "${key}": id manquant.`)
        if (typeof al.name !== 'string') errors.push(`Liste "${key}": name manquant.`)
        if (typeof al.factionId !== 'string') errors.push(`Liste "${key}": factionId manquant.`)
        if (!Array.isArray(al.units)) errors.push(`Liste "${key}": units manquant.`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
