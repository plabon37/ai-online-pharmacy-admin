import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectToDB } from "@/lib/connectToDB";
import User from "@/lib/models/User";

export const runtime = "nodejs";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

type JwtPayload = {
  userId: string;
  email: string;
  role: "ADMIN";
};

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------
    const body = (await request.json()) as LoginRequestBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // --------------------------------------------------
    // 2. Validate input
    // --------------------------------------------------
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Check JWT secret
    // --------------------------------------------------
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined");

      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Server configuration error",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. Connect to database
    // --------------------------------------------------
    await connectToDB();

    // --------------------------------------------------
    // 5. Find admin user
    // --------------------------------------------------
    const admin = await User.findOne({
      email,
      role: "ADMIN",
      isActive: true,
    }).select("+password");

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 6. Compare password
    // --------------------------------------------------
    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 7. Create JWT payload
    // --------------------------------------------------
    const payload: JwtPayload = {
      userId: admin._id.toString(),
      email: admin.email,
      role: "ADMIN",
    };

    // --------------------------------------------------
    // 8. Generate JWT
    // --------------------------------------------------
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "7d",
    });

    // --------------------------------------------------
    // 9. Create response
    // --------------------------------------------------
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
        message: "Admin login successful",
      },
      { status: 200 }
    );

    // --------------------------------------------------
    // 10. Store JWT in secure HttpOnly cookie
    // --------------------------------------------------
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Admin Login Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Something went wrong while logging in",
      },
      { status: 500 }
    );
  }
}