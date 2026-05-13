import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'admin@construction.com';
  const password = 'Construction@2024';

  console.log(`Checking if user ${email} exists...`);
  
  // 1. Create the user in Auth
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
      console.log('User already exists. Updating metadata...');
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existingUser = userList?.users.find(u => u.email === email);
      
      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { 
            name: 'ERP Super Admin',
            role: 'SUPER_ADMIN' 
          }
        });
        console.log('Metadata updated to SUPER_ADMIN.');
      }
    } else {
      console.error('Error creating user:', error.message);
    }
  } else {
    console.log('User created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

createAdmin();
