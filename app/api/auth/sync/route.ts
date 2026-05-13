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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new ApiError(500, "Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

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
      const userCount = await prisma.user.count();
      
      const isInitialAdmin = userCount === 0 || 
                             email === 'admin@construction.com' || 
                             email === 'amin123@gmail.com' || 
                             email === 'xuandai0229@gmail.com';

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

    return successResponse(user);
  } catch (error: any) {
    return handleApiError(error);
  }
}
