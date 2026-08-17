import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const admin = requireAdmin(
      request
    );

    const body =
      (await request.json()) as ChangePasswordBody;

    const currentPassword =
      body.currentPassword?.trim() ||
      "";

    const newPassword =
      body.newPassword?.trim() ||
      "";

    const confirmPassword =
      body.confirmPassword?.trim() ||
      "";

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "All password fields are required",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "New password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "New password and confirm password do not match",
        },
        { status: 400 }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "New password must be different from current password",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    const user =
      await User.findOne({
        _id: admin.userId,
        role: "ADMIN",
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Admin account not found",
        },
        { status: 404 }
      );
    }

    /* ========================================================
       CURRENT PASSWORD CHECK
    ======================================================== */

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Current password is incorrect",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       HASH NEW PASSWORD
    ======================================================== */

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password =
      hashedPassword;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        data: null,
        message:
          "Password changed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Unauthorized",
          },
          { status: 401 }
        );
      }

      if (
        error.message ===
        "FORBIDDEN"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Admin access required",
          },
          { status: 403 }
        );
      }

      if (
        error.message ===
        "SERVER_CONFIG_ERROR"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Server configuration error",
          },
          { status: 500 }
        );
      }
    }

    console.error(
      "Change Password Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to change password",
      },
      { status: 500 }
    );
  }
}