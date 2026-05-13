import { prisma } from "@/lib/prisma";
import { UserRole } from "@/app/types";
import { createClient } from "@supabase/supabase-js";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";

/**
 * AUTH SYNC ENGINE
 * Synchronizes Supabase Auth User with ERP Database User.
 */
export async function POST(req: Request) {
  try {
    const { email, name, id } = await req.json();

    if (!email) {
      throw new ApiError(400, "Missing email");
    }

    // SECURITY: Verify Supabase Token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      throw new ApiError(401, "Invalid token");
    }

    if (authUser.email !== email) {
      throw new ApiError(403, "Identity mismatch");
    }

    // 1. Find user in DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 2. Provision new user
      // SEC-003 FIX: No hardcoded email whitelist.
      // SUPER_ADMIN is only granted to the very first user (bootstrap),
      // or to the email designated via INITIAL_ADMIN_EMAIL env var.
      const userCount = await prisma.user.count();
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || '';

      const isInitialAdmin = userCount === 0 ||
                             (initialAdminEmail !== '' && email === initialAdminEmail);

      const initialRole: UserRole = isInitialAdmin ? 'SUPER_ADMIN' : 'VIEWER';

      user = await prisma.user.create({
        data: {
          id: id, 
          email,
          name: name || email.split('@')[0],
          role: initialRole,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { 
          name: name || user.name,
          id: id 
        }
      });
    }

    // SEC-001 FIX: Sync canonical role + companyId into Supabase app_metadata.
    // app_metadata is ADMIN-ONLY writable (requires service role key).
    // The proxy middleware reads from app_metadata — this ensures role cannot be
    // spoofed via user-writable user_metadata.
    await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: {
        role: user.role,
        companyId: user.companyId || null,
      }
    });

    return successResponse(user);
  } catch (error: any) {
    return handleApiError(error);
  }
}
