import {
  NextRequest,
} from "next/server";

import jwt from "jsonwebtoken";

import {
  connectToDB,
} from "@/lib/connectToDB";

import User from "@/lib/models/User";

/* ============================================================
   CUSTOMER JWT PAYLOAD
============================================================ */

export type CustomerJwtPayload = {
  userId: string;
  email: string;
  role: "CUSTOMER";
};

/* ============================================================
   CUSTOMER USER
============================================================ */

export type AuthenticatedCustomer = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
  isActive: boolean;
};

/* ============================================================
   REQUIRE CUSTOMER
============================================================ */

export async function requireCustomer(
  request: NextRequest
): Promise<AuthenticatedCustomer> {
  /* ==========================================================
     1. JWT SECRET
  ========================================================== */

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "SERVER_CONFIG_ERROR"
    );
  }

  /* ==========================================================
     2. GET CUSTOMER TOKEN
  ========================================================== */

  const token =
    request.cookies.get(
      "customer_token"
    )?.value;

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  /* ==========================================================
     3. VERIFY TOKEN
  ========================================================== */

  let payload:
    | CustomerJwtPayload
    | null = null;

  try {
    const decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as CustomerJwtPayload;

    if (
      !decoded ||
      decoded.role !==
        "CUSTOMER" ||
      !decoded.userId ||
      !decoded.email
    ) {
      throw new Error(
        "INVALID_TOKEN"
      );
    }

    payload = decoded;
  } catch {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  /* ==========================================================
     4. DATABASE
  ========================================================== */

  await connectToDB();

  /* ==========================================================
     5. VERIFY CUSTOMER STILL EXISTS
     
     This is important because Admin can deactivate
     a customer from Customer Management.
  ========================================================== */

  const customer =
    await User.findOne({
      _id: payload.userId,
      email: payload.email,
      role: "CUSTOMER",
      isActive: true,
    })
      .select(
        "_id name email role isActive"
      )
      .lean();

  if (!customer) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  /* ==========================================================
     6. RETURN SAFE CUSTOMER DATA
  ========================================================== */

  return {
    id: customer._id.toString(),

    name:
      customer.name || "",

    email:
      customer.email || "",

    role:
      "CUSTOMER",

    isActive:
      Boolean(
        customer.isActive
      ),
  };
}