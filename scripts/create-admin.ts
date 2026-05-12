import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log("Creating SUPER_ADMIN account...");
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@construction.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      name: 'Hệ thống Quản trị (Super Admin)',
      role: 'SUPER_ADMIN'
    }
  });

  if (error) {
    console.error("❌ Failed to create user:", error.message);
  } else {
    console.log("✅ User created successfully!");
    console.log("Email:", data.user.email);
    console.log("Password: password123");
    console.log("Role:", data.user.user_metadata.role);
  }
}

createAdmin();
