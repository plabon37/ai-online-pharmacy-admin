import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Order from "@/lib/models/Order";

export async function GET(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments({}),

      Order.countDocuments({
        status: "PENDING",
      }),

      Order.countDocuments({
        status: {
          $in: ["CONFIRMED", "PROCESSING", "SHIPPED"],
        },
      }),

      Order.countDocuments({
        status: "DELIVERED",
      }),

      Order.aggregate([
        {
          $match: {
            status: {
              $ne: "CANCELLED",
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult[0]?.totalRevenue ?? 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          processingOrders,
          deliveredOrders,
          totalRevenue,
        },
        message:
          "Order statistics fetched successfully",
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
            message: "Admin access required",
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
      "Dashboard Order Stats Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch order statistics",
      },
      { status: 500 }
    );
  }
}