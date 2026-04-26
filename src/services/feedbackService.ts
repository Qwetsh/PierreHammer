import { supabase } from '@/lib/supabase'

export interface Feedback {
  id: string
  type: 'bug' | 'suggestion'
  message: string
  contact_email: string | null
  user_id: string | null
  user_email: string | null
  user_name: string | null
  user_agent: string | null
  status: 'new' | 'read' | 'done' | 'dismissed'
  admin_note: string | null
  created_at: string
}

export async function submitFeedback(data: {
  type: 'bug' | 'suggestion'
  message: string
  contactEmail?: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('ph_feedbacks').insert({
    type: data.type,
    message: data.message,
    contact_email: user ? null : (data.contactEmail || null),
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    user_name: user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? null,
    user_agent: navigator.userAgent,
  })
  if (error) throw error
}

export async function fetchAllFeedbacks(): Promise<Feedback[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ph_feedbacks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Feedback[]) ?? []
}

export async function updateFeedbackStatus(id: string, status: Feedback['status'], adminNote?: string): Promise<void> {
  if (!supabase) return
  const update: Record<string, unknown> = { status }
  if (adminNote !== undefined) update.admin_note = adminNote
  const { error } = await supabase.from('ph_feedbacks').update(update).eq('id', id)
  if (error) throw error
}
