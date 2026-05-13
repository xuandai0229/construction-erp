import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjjpcbmdyrsalsoxmeoh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqanBjYm1keXJzYWxzb3htZW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNzA4NCwiZXhwIjoyMDkyODkzMDg0fQ.-oz1Y1uzyFlRqZiT9ogreRTAh0_m8Vocw8YACZBYUBE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'admin@construction.com';
  const password = 'Construction@2024';

  console.log(`Checking if user ${email} exists...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      name: 'ERP Super Admin',
      role: 'SUPER_ADMIN' 
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. Updating role...');
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existingUser = userList?.users.find(u => u.email === email);
      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { role: 'SUPER_ADMIN', name: 'ERP Super Admin' }
        });
        console.log('Role updated.');
      }
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('Admin account ready!');
  }
}

createAdmin();
