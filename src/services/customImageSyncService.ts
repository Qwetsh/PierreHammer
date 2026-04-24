import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const BUCKET = 'custom-images'

// Session-level cache of remote image IDs per user (avoids 400s for non-existent images)
let _remoteIdsCache: Map<string, Set<string>> = new Map()
let _remoteIdsFetching: Map<string, Promise<Set<string>>> = new Map()

async function getRemoteIds(userId: string): Promise<Set<string>> {
  const cached = _remoteIdsCache.get(userId)
  if (cached) return cached

  const existing = _remoteIdsFetching.get(userId)
  if (existing) return existing

  const promise = listUserImages(userId).then((ids) => {
    const set = new Set(ids)
    _remoteIdsCache.set(userId, set)
    _remoteIdsFetching.delete(userId)
    return set
  })
  _remoteIdsFetching.set(userId, promise)
  return promise
}

/** Invalidate the remote IDs cache (call after upload/delete) */
export function invalidateRemoteCache(userId: string) {
  _remoteIdsCache.delete(userId)
}

/** Check if a remote image exists for this datasheet (uses cached list) */
export async function hasRemoteImage(userId: string, datasheetId: string): Promise<boolean> {
  const ids = await getRemoteIds(userId)
  return ids.has(datasheetId)
}

function getPath(userId: string, datasheetId: string): string {
  return `${userId}/${datasheetId}.jpg`
}

/** Upload image blob to Supabase Storage */
export async function uploadImage(userId: string, datasheetId: string, blob: Blob): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  const path = getPath(userId, datasheetId)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) {
    console.warn('[customImageSync] upload failed:', error.message)
    return false
  }
  invalidateRemoteCache(userId)
  return true
}

/** Download image blob from Supabase Storage */
export async function downloadImage(userId: string, datasheetId: string): Promise<Blob | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const path = getPath(userId, datasheetId)
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) return null
  return data
}

/** Delete image from Supabase Storage */
export async function deleteImage(userId: string, datasheetId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  const path = getPath(userId, datasheetId)
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.warn('[customImageSync] delete failed:', error.message)
    return false
  }
  invalidateRemoteCache(userId)
  return true
}

/** List all custom image datasheet IDs for a user */
export async function listUserImages(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase.storage.from(BUCKET).list(userId)
  if (error || !data) return []
  return data
    .filter((f) => f.name.endsWith('.jpg'))
    .map((f) => f.name.replace('.jpg', ''))
}

/** Sync all local images to Supabase (upload missing ones) */
export async function syncLocalToRemote(
  userId: string,
  getLocalBlob: (datasheetId: string) => Promise<Blob | null>,
  localIds: string[],
): Promise<number> {
  const remoteIds = new Set(await listUserImages(userId))
  let uploaded = 0
  for (const id of localIds) {
    if (!remoteIds.has(id)) {
      const blob = await getLocalBlob(id)
      if (blob) {
        await uploadImage(userId, id, blob)
        uploaded++
      }
    }
  }
  return uploaded
}

/** Sync remote images to local (download missing ones) */
export async function syncRemoteToLocal(
  userId: string,
  hasLocal: (datasheetId: string) => Promise<boolean>,
  saveLocal: (datasheetId: string, blob: Blob) => Promise<void>,
): Promise<number> {
  const remoteIds = await listUserImages(userId)
  let downloaded = 0
  for (const id of remoteIds) {
    const exists = await hasLocal(id)
    if (!exists) {
      const blob = await downloadImage(userId, id)
      if (blob) {
        await saveLocal(id, blob)
        downloaded++
      }
    }
  }
  return downloaded
}
