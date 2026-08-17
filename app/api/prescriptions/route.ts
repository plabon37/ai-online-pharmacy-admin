import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Prescription from "@/lib/models/Prescription";

export async function GET(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const prescriptions =
      await Prescription.find({})
        .populate({
          path: "user",
          select: "name email",
        })
        .populate({
          path: "reviewedBy",
          select: "name email role",
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        data: prescriptions,
        message:
          "Prescriptions fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
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
      "Get Prescriptions Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch prescriptions",
      },
      { status: 500 }
    );
  }
}