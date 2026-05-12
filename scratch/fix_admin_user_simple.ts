import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = 'https://qjjpcbmdyrsalsoxmeoh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqanBjYm1keXJzYWxzb3htZW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNzA4NCwiZXhwIjoyMDkyODkzMDg0fQ.-oz1Y1uzyFlRqZiT9ogreRTAh0_m8Vocw8YACZBYUBE';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function main() {
  const email = 'amin123@gmail.com';
  const password = 'Admin@123';

  console.log(`Setting up admin user: ${email}`);

  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  let authUser = users.find(u => u.email === email);

  if (authUser) {
    console.log('User exists in Auth, updating password...');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: password,
      email_confirm: true
    });
    if (updateError) throw updateError;
  } else {
    console.log('User does not exist in Auth, creating...');
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Super Admin' }
    });
    if (createError) throw createError;
    authUser = user!;
  }

  const dbUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email,
      role: 'SUPER_ADMIN' as any,
      name: 'Super Admin'
    },
    create: {
      id: authUser.id,
      email,
      role: 'SUPER_ADMIN' as any,
      name: 'Super Admin'
    }
  });

  console.log('Database user synchronized:', dbUser.email);
  console.log(`Admin login: ${email} / ${password}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
