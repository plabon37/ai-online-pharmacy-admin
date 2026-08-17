import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CurrentAdmin {
  userId: string;
  email: string;
  role: "ADMIN";
}

export const getCurrentAdmin = async (): Promise<CurrentAdmin | null> => {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined");
      return null;
    }

    let decoded: string | JwtPayload;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return null;
    }

    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload & {
      userId?: unknown;
      email?: unknown;
      role?: unknown;
    };

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "ADMIN"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: "ADMIN",
    };
  } catch (error) {
    console.error("Get Current Admin Error:", error);
    return null;
  }
};