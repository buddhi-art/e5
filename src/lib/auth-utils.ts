import { SupabaseClient } from '@supabase/supabase-js'

export async function verifyAdminOrFounder(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, designation')
    .eq('id', userId)
    .single();
    
  return profile?.role === 'admin' || profile?.designation === 'Founder';
}
