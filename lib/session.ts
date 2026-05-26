import crypto from "crypto";
import { ApiError } from "./api-error";

const globalForSession = globalThis as unknown as { devSessionSecret?: string };

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(500, "SESSION_SECRET must be configured with at least 32 characters in production.");
  }

  if (!globalForSession.devSessionSecret) {
    globalForSession.devSessionSecret = crypto.randomBytes(48).toString("base64url");
  }
  return globalForSession.devSessionSecret;
}

const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours session lifecycle (Batch 7.1)

export interface SecureSession {
  userId: string;
  role: string;
  companyId?: string | null;
  expiresAt: number;
}

export class SessionManager {
  /**
   * Cryptographically signs and generates a secure session token
   */
  static createSession(userId: string, role: string, companyId?: string | null): string {
    const expiresAt = Date.now() + SESSION_EXPIRY_MS;
    const payload = JSON.stringify({ userId, role, companyId: companyId || null, expiresAt });
    const payloadBase64 = Buffer.from(payload).toString("base64url");
    
    const signature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadBase64)
      .digest("base64url");

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Cryptographically verifies session token integrity and expiration
   */
  static verifySession(token: string | null): SecureSession | null {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadBase64)
      .digest("base64url");

    // Timing-safe verification to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "base64url");
    const expBuffer = Buffer.from(expectedSignature, "base64url");
    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    try {
      const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
      const session = JSON.parse(payloadStr) as SecureSession;

      // Validate session expiration (Batch 7.1 session expiration)
      if (Date.now() > session.expiresAt) {
        return null; // Session expired
      }

      return session;
    } catch {
      return null;
    }
  }
}
