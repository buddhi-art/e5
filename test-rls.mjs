import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Simulate the login of the admin
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@e5chronicles.com',
    password: 'e5adminpassword'
  });
  if (error) {
    console.log("Login error:", error.message);
    return;
  }
  
  const userId = data.user.id;
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('role, designation')
    .eq('id', userId)
    .single();
    
  console.log("Profile read with RLS:", profile, profError);
}

test();
