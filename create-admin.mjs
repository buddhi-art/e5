import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.error("Missing ADMIN_PASSWORD in .env.local")
    process.exit(1)
  }

  console.log(`\nSetting up admin account for ${email}...\n`)

  // 1. Try to create the user, but it's fine if they already exist
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'E5 Administrator' }
  })

  if (createError && !createError.message.includes('already')) {
    console.error('Error creating user:', createError.message)
    return
  }

  if (createData?.user) {
    console.log('✅ Auth user created:', createData.user.id)
  } else {
    console.log('ℹ️  Auth user already exists. Finding their ID...')
  }

  // 2. Find the user by listing all users
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
  if (usersError) {
    console.error('Error fetching users:', usersError.message)
    return
  }

  const user = usersData.users.find(u => u.email === email)
  if (!user) {
    console.error('Could not find user after creation attempt.')
    return
  }

  console.log(`🔑 User ID: ${user.id}`)

  // 3. Check if profile exists
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    // Profile exists, just update the role
    console.log(`ℹ️  Profile exists with role "${existingProfile.role}". Updating to "admin"...`)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin', full_name: 'E5 Administrator' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError.message)
      return
    }
  } else {
    // Profile doesn't exist (trigger may not have fired), insert it manually
    console.log('ℹ️  Profile does not exist. Creating it manually...')
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: user.id, role: 'admin', full_name: 'E5 Administrator' })

    if (insertError) {
      console.error('Error inserting profile:', insertError.message)
      return
    }
  }

  console.log('\n========================================')
  console.log('   ✅ ADMIN ACCOUNT READY!')
  console.log('========================================')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log('========================================')
  console.log('\nYou can now log in at http://localhost:3000\n')
}

createAdmin()
