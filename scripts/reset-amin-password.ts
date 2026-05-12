import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjjpcbmdyrsalsoxmeoh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqanBjYm1keXJzYWxzb3htZW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNzA4NCwiZXhwIjoyMDkyODkzMDg0fQ.-oz1Y1uzyFlRqZiT9ogreRTAh0_m8Vocw8YACZBYUBE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
  const email = 'amin123@gmail.com';
  const newPassword = 'Construction@2024';

  console.log(`Attempting to reset password for ${email}...`);
  
  // 1. Get User ID by Email
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const targetUser = userList.users.find(u => u.email === email);

  if (!targetUser) {
    console.error(`User ${email} not found in Supabase Auth.`);
    return;
  }

  // 2. Update Password
  const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
    password: newPassword
  });

  if (updateError) {
    console.error('Error updating password:', updateError.message);
  } else {
    console.log('--- PASSWORD RESET SUCCESSFUL ---');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('---------------------------------');
  }
}

resetPassword();
