import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export async function searchUsers(query: string): Promise<Profile[]> {
  if (!isSupabaseConfigured || !supabase || !query.trim()) return []
  try {
    const { data, error } = await supabase.rpc('search_ph_users', {
      p_query: query.trim(),
      p_limit: 20,
    })
    if (error) {
      console.error('searchUsers error:', error.message)
      return []
    }
    return (data as Profile[]) || []
  } catch (e) {
    console.error('searchUsers exception:', e)
    return []
  }
}

export async function markPhRegistered(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase
      .from('profiles')
      .update({ ph_registered: true } as Record<string, unknown>)
      .eq('id', userId)
  } catch {
    // silent — non-critical
  }
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('ph_friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
      .select('id')
      .single()
    if (error) {
      console.error('sendFriendRequest error:', error.message)
      return null
    }
    return data.id
  } catch (e) {
    console.error('sendFriendRequest exception:', e)
    return null
  }
}

export async function respondToRequest(friendshipId: string, accept: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('ph_friendships')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', friendshipId)
    if (error) {
      console.error('respondToRequest error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('respondToRequest exception:', e)
    return false
  }
}

export async function getFriends(userId: string): Promise<Friendship[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.rpc('get_friends_list', { p_user_id: userId })
    if (error) {
      console.error('getFriends error:', error.message)
      return []
    }
    return ((data ?? []) as { friendship_id: string; requester_id: string; addressee_id: string; status: string; created_at: string; friend_id: string; friend_username: string | null; friend_display_name: string | null }[]).map((r) => ({
      id: r.friendship_id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status as Friendship['status'],
      created_at: r.created_at,
      requester: r.requester_id === userId ? undefined : { id: r.friend_id, username: r.friend_username, display_name: r.friend_display_name, created_at: r.created_at },
      addressee: r.addressee_id === userId ? undefined : { id: r.friend_id, username: r.friend_username, display_name: r.friend_display_name, created_at: r.created_at },
    }))
  } catch (e) {
    console.error('getFriends exception:', e)
    return []
  }
}

export async function getPendingRequests(userId: string): Promise<Friendship[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.rpc('get_pending_requests', { p_user_id: userId })
    if (error) {
      console.error('getPendingRequests error:', error.message)
      return []
    }
    return ((data ?? []) as { friendship_id: string; requester_id: string; addressee_id: string; status: string; created_at: string; req_id: string; req_username: string | null; req_display_name: string | null }[]).map((r) => ({
      id: r.friendship_id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status as Friendship['status'],
      created_at: r.created_at,
      requester: { id: r.req_id, username: r.req_username, display_name: r.req_display_name, created_at: r.created_at },
    }))
  } catch (e) {
    console.error('getPendingRequests exception:', e)
    return []
  }
}

export async function getSentRequests(userId: string): Promise<Friendship[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.rpc('get_sent_requests', { p_user_id: userId })
    if (error) {
      console.error('getSentRequests error:', error.message)
      return []
    }
    return ((data ?? []) as { friendship_id: string; requester_id: string; addressee_id: string; status: string; created_at: string; addr_id: string; addr_username: string | null; addr_display_name: string | null }[]).map((r) => ({
      id: r.friendship_id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status as Friendship['status'],
      created_at: r.created_at,
      addressee: { id: r.addr_id, username: r.addr_username, display_name: r.addr_display_name, created_at: r.created_at },
    }))
  } catch (e) {
    console.error('getSentRequests exception:', e)
    return []
  }
}

export async function removeFriend(friendshipId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('ph_friendships')
      .delete()
      .eq('id', friendshipId)
    if (error) {
      console.error('removeFriend error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('removeFriend exception:', e)
    return false
  }
}

export async function updateUsername(userId: string, username: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId)
    if (error) {
      console.error('updateUsername error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('updateUsername exception:', e)
    return false
  }
}

export interface FriendOwner {
  user_id: string
  username: string | null
  display_name: string | null
}

export async function getFriendsWithDatasheet(datasheetId: string): Promise<FriendOwner[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.rpc('get_friends_with_datasheet', {
      p_datasheet_id: datasheetId,
    })
    if (error) {
      console.error('getFriendsWithDatasheet error:', error.message)
      return []
    }
    return (data as FriendOwner[]) || []
  } catch (e) {
    console.error('getFriendsWithDatasheet exception:', e)
    return []
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('getProfile error:', error.message)
      return null
    }
    return data as Profile
  } catch (e) {
    console.error('getProfile exception:', e)
    return null
  }
}
