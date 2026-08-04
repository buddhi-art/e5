import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('subtasks').select('id, title, is_completed, status').eq('task_id', 'de0acbc7-55cc-4d97-99a8-fc12f10affee');
  console.log("Subtasks:", data);
}
check();
