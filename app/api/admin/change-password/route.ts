import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";

export const dynamic =
  "force-dynamic";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    /* ==========================================================
       ADMIN AUTH
    ========================================================== */

    const admin = requireAdmin(
      request
    );

    if (!admin?.userId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* ==========================================================
       READ BODY
    ========================================================== */

    let body: ChangePasswordBody;

    try {
      body =
        (await request.json()) as ChangePasswordBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    const currentPassword =
      typeof body.currentPassword ===
      "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword ===
      "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    /* ==========================================================
       VALIDATION
    ========================================================== */

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
        {
          status: 400,
        }
      );
    }

    if (
      newPassword.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "New password must be at least 8 characters long",
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    /* ==========================================================
       DATABASE
    ========================================================== */

    await connectToDB();

    /* ==========================================================
       GET ADMIN
    ========================================================== */

    const adminUser =
      await User.findOne({
        _id: admin.userId,
        role: "ADMIN",
      }).select(
        "+password +passwordHash"
      );

    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Admin account not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ==========================================================
       GET STORED PASSWORD
    ========================================================== */

    /*
     * Support both common field names:
     *
     * password
     * passwordHash
     *
     * This makes the route work even if your
     * User model uses either naming convention.
     */

    const storedPassword =
      typeof (adminUser as any)
        .password === "string"
        ? (adminUser as any)
            .password
        : typeof (
              adminUser as any
            ).passwordHash ===
            "string"
          ? (
              adminUser as any
            ).passwordHash
          : "";

    if (!storedPassword) {
      console.error(
        "Admin password field is missing for user:",
        admin.userId
      );

      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Admin password is not configured correctly",
        },
        {
          status: 500,
        }
      );
    }

    /* ==========================================================
       VERIFY CURRENT PASSWORD
    ========================================================== */

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        storedPassword
      );

    if (
      !currentPasswordMatches
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Current password is incorrect",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================================================
       HASH NEW PASSWORD
    ========================================================== */

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    /* ==========================================================
       UPDATE PASSWORD
    ========================================================== */

    if (
      typeof (adminUser as any)
        .password === "string"
    ) {
      (adminUser as any).password =
        hashedPassword;
    } else if (
      typeof (adminUser as any)
        .passwordHash === "string"
    ) {
      (adminUser as any).passwordHash =
        hashedPassword;
    } else {
      /*
       * Normally unreachable because we already
       * checked storedPassword above.
       */
      (adminUser as any).password =
        hashedPassword;
    }

    await adminUser.save();

    /* ==========================================================
       SUCCESS
    ========================================================== */

    return NextResponse.json(
      {
        success: true,
        data: null,
        message:
          "Password changed successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Change Password API Error:",
      error
    );

    /* ==========================================================
       AUTH ERRORS
    ========================================================== */

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
          {
            status: 401,
          }
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
          {
            status: 403,
          }
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
          {
            status: 500,
          }
        );
      }
    }

    /* ==========================================================
       GENERAL ERROR
    ========================================================== */

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to change password",
      },
      {
        status: 500,
      }
    );
  }
}