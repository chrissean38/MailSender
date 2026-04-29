import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerConfig } from '@/lib/server-config';

const { url: supabaseUrl, serviceRoleKey: supabaseKey } = getSupabaseServerConfig();
export const supabase = createClient(supabaseUrl, supabaseKey);
