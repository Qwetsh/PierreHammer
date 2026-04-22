import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'pierrehammer-images'
const DB_VERSION = 1
const STORE_NAME = 'custom-images'
const MAX_SIZE = 400

interface CustomImageEntry {
  datasheetId: string
  blob: Blob
  updatedAt: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'datasheetId' })
        }
      },
    })
  }
  return dbPromise
}

/**
 * Resize an image file to MAX_SIZE x MAX_SIZE max, preserving aspect ratio.
 * Returns a compressed JPEG blob.
 */
async function resizeImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        },
        'image/jpeg',
        0.85,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/** Save a custom image for a datasheet. Resizes automatically. */
export async function saveCustomImage(datasheetId: string, file: File | Blob): Promise<string> {
  const blob = await resizeImage(file)
  const db = await getDb()
  const entry: CustomImageEntry = { datasheetId, blob, updatedAt: Date.now() }
  await db.put(STORE_NAME, entry)
  return URL.createObjectURL(blob)
}

/** Get the custom image URL for a datasheet. Returns null if none. */
export async function getCustomImageUrl(datasheetId: string): Promise<string | null> {
  const db = await getDb()
  const entry: CustomImageEntry | undefined = await db.get(STORE_NAME, datasheetId)
  if (!entry) return null
  return URL.createObjectURL(entry.blob)
}

/** Delete a custom image for a datasheet. */
export async function deleteCustomImage(datasheetId: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, datasheetId)
}

/** Check if a datasheet has a custom image. */
export async function hasCustomImage(datasheetId: string): Promise<boolean> {
  const db = await getDb()
  const entry = await db.get(STORE_NAME, datasheetId)
  return !!entry
}

/** Get all custom images as base64 for export. */
export async function exportAllCustomImages(): Promise<Record<string, string>> {
  const db = await getDb()
  const entries: CustomImageEntry[] = await db.getAll(STORE_NAME)
  const result: Record<string, string> = {}

  for (const entry of entries) {
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(entry.blob)
    })
    result[entry.datasheetId] = base64
  }

  return result
}

/** Import custom images from base64 export data. */
export async function importAllCustomImages(data: Record<string, string>): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')

  for (const [datasheetId, base64] of Object.entries(data)) {
    const response = await fetch(base64)
    const blob = await response.blob()
    await tx.store.put({ datasheetId, blob, updatedAt: Date.now() })
  }

  await tx.done
}

/** Clear all custom images. */
export async function clearAllCustomImages(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE_NAME)
}

/** Get the raw blob for a datasheet (for sync). */
export async function getCustomImageBlob(datasheetId: string): Promise<Blob | null> {
  const db = await getDb()
  const entry: CustomImageEntry | undefined = await db.get(STORE_NAME, datasheetId)
  return entry?.blob ?? null
}

/** List all datasheet IDs that have custom images. */
export async function listCustomImageIds(): Promise<string[]> {
  const db = await getDb()
  const keys = await db.getAllKeys(STORE_NAME)
  return keys as string[]
}

/** Save a blob directly (for sync download, no resize needed). */
export async function saveCustomImageBlob(datasheetId: string, blob: Blob): Promise<void> {
  const db = await getDb()
  const entry: CustomImageEntry = { datasheetId, blob, updatedAt: Date.now() }
  await db.put(STORE_NAME, entry)
}
