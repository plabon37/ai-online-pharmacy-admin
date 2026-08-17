import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Medicine from "@/lib/models/Medicine";
import Order from "@/lib/models/Order";
import Prescription from "@/lib/models/Prescription";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const [
      outOfStock,
      lowStock,
      pendingOrders,
      pendingPrescriptions,
    ] = await Promise.all([
      Medicine.countDocuments({
        isActive: true,
        stock: {
          $lte: 0,
        },
      }),

      Medicine.countDocuments({
        isActive: true,
        stock: {
          $gt: 0,
          $lte: 10,
        },
      }),

      Order.countDocuments({
        status: "PENDING",
      }),

      Prescription.countDocuments({
        status: "PENDING",
      }),
    ]);

    const totalNotifications =
      outOfStock +
      lowStock +
      pendingOrders +
      pendingPrescriptions;

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications: {
            outOfStock,
            lowStock,
            pendingOrders,
            pendingPrescriptions,
          },
          totalNotifications,
        },
        message:
          "Notifications fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
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

    console.error(
      "Dashboard Notifications Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}