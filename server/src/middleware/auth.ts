import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../lib/supabase.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  accessToken?: string;
}

export type TokenVerifier = (token: string) => Promise<{ id: string; email?: string } | null>;

export function createSupabaseTokenVerifier(
  supabase: SupabaseClient = getSupabaseAdmin(),
): TokenVerifier {
  return async (token: string) => {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? undefined };
  };
}

export function createAuthMiddleware(verifier: TokenVerifier = createSupabaseTokenVerifier()) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or malformed Authorization bearer token.",
        },
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Bearer token is empty.",
        },
      });
      return;
    }

    try {
      const user = await verifier(token);
      if (!user) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired authentication token.",
          },
        });
        return;
      }
      req.userId = user.id;
      req.userEmail = user.email;
      req.accessToken = token;
      next();
    } catch {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication verification failed.",
        },
      });
    }
  };
}

