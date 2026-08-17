import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: admin.userId,
          email: admin.email,
          role: admin.role,
        },
        message: "Protected admin route accessed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Protected Route Error:", error);

    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Admin access required",
          },
          { status: 403 }
        );
      }

      if (
        error.message === "UNAUTHORIZED" ||
        error.message === "INVALID_TOKEN"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      if (error.message === "SERVER_CONFIG_ERROR") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Server configuration error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}