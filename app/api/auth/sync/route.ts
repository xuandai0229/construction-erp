import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { RoleKey } from "@/app/types";

/**
 * AUTH SYNC ENGINE
 * Synchronizes Supabase Auth User with ERP Database User.
 * This allows managing Roles and Permissions in our DB instead of Supabase metadata.
 */
export async function POST(req: Request) {
  try {
    const { email, name, id } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // 1. Find user in DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 2. Provision new user
      const userCount = await prisma.user.count();
      
      // Automatic SUPER_ADMIN for the first user or specific emails
      const isInitialAdmin = userCount === 0 || 
                             email === 'admin@construction.com' || 
                             email === 'amin123@gmail.com' || 
                             email === 'xuandai0229@gmail.com';

      const initialRole: RoleKey = isInitialAdmin ? 'SUPER_ADMIN' : 'VIEWER';

      console.log(`[AuthSync] Provisioning new user: ${email} with role ${initialRole}`);

      user = await prisma.user.create({
        data: {
          id: id, // Sync with Supabase UID
          email,
          name: name || email.split('@')[0],
          role: initialRole,
        },
      });
    } else {
      // Update name or id if changed
      user = await prisma.user.update({
        where: { email },
        data: { 
          name: name || user.name,
          id: id // Ensure ID is synced
        }
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[AuthSync] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
