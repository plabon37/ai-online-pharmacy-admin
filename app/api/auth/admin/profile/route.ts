import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const admin = requireAdmin(request);

    if (!admin?.userId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectToDB();

    const user = await User.findOne({
      _id: admin.userId,
      role: "ADMIN",
    })
      .select(
        "_id name email role createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Admin profile not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          role: user.role || "ADMIN",
          createdAt:
            user.createdAt instanceof Date
              ? user.createdAt.toISOString()
              : null,
          updatedAt:
            user.updatedAt instanceof Date
              ? user.updatedAt.toISOString()
              : null,
        },
        message:
          "Admin profile fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin Profile API Error:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message === "UNAUTHORIZED"
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

      if (
        error.message === "FORBIDDEN"
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

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch admin profile",
      },
      { status: 500 }
    );
  }
}