import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AdminAuthPayload {
  userId: string;
  email: string;
  role: "ADMIN";
}

export const requireAdmin = (
  request: NextRequest
): AdminAuthPayload => {
  // --------------------------------------------------
  // 1. Get JWT from HttpOnly cookie
  // --------------------------------------------------
  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  // --------------------------------------------------
  // 2. Get JWT secret
  // --------------------------------------------------
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not defined");

    throw new Error("SERVER_CONFIG_ERROR");
  }

  try {
    // --------------------------------------------------
    // 3. Verify JWT
    // --------------------------------------------------
    const decoded = jwt.verify(token, jwtSecret);

    // --------------------------------------------------
    // 4. Make sure decoded data is an object
    // --------------------------------------------------
    if (
      typeof decoded === "string" ||
      !("userId" in decoded) ||
      !("email" in decoded) ||
      !("role" in decoded)
    ) {
      throw new Error("INVALID_TOKEN");
    }

    const payload = decoded as JwtPayload & {
      userId?: unknown;
      email?: unknown;
      role?: unknown;
    };

    // --------------------------------------------------
    // 5. Validate required fields
    // --------------------------------------------------
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "ADMIN"
    ) {
      throw new Error("FORBIDDEN");
    }

    // --------------------------------------------------
    // 6. Return verified admin information
    // --------------------------------------------------
    return {
      userId: payload.userId,
      email: payload.email,
      role: "ADMIN",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "FORBIDDEN" ||
        error.message === "INVALID_TOKEN"
      ) {
        throw error;
      }
    }

    throw new Error("UNAUTHORIZED");
  }
};