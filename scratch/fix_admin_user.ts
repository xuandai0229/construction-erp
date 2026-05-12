import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  // 1. Check if user exists in Supabase Auth
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

  console.log(`Auth user ID: ${authUser.id}`);

  // 2. Ensure user exists in Prisma (public.User)
  const dbUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    },
    create: {
      id: authUser.id,
      email,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    }
  });

  console.log('Database user synchronized:', dbUser);
  console.log(`Admin login: ${email} / ${password}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
