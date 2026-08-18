import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";
import Medicine from "@/lib/models/Medicine";
import Order from "@/lib/models/Order";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    const admin = requireAdmin(
      request
    );

    if (!admin?.userId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       BASIC COUNTS
    ======================================================== */

    const [
      totalMedicines,
      totalCustomers,
      totalOrders,
      lowStockMedicines,
      outOfStockMedicines,
      pendingOrders,
    ] = await Promise.all([
      Medicine.countDocuments({}),

      User.countDocuments({
        role: {
          $ne: "ADMIN",
        },
      }),

      Order.countDocuments({}),

      Medicine.countDocuments({
        stock: {
          $gt: 0,
          $lte: 10,
        },
      }),

      Medicine.countDocuments({
        stock: {
          $lte: 0,
        },
      }),

      Order.countDocuments({
        status: "PENDING",
      }),
    ]);

    /* ========================================================
       REVENUE
    ======================================================== */

    const revenueResult =
      await Order.aggregate([
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
              $sum: {
                $ifNull: [
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
      ]);

    const totalRevenue =
      Number(
        revenueResult[0]
          ?.totalRevenue || 0
      );

    /* ========================================================
       RECENT ORDERS
    ======================================================== */

    const recentOrders =
      await Order.find({})
        .populate({
          path: "user",
          select:
            "name email",
        })
        .select(
          "_id user totalAmount status paymentStatus createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean();

    const serializedRecentOrders =
      recentOrders.map(
        (order) => ({
          _id:
            order._id.toString(),

          customer:
            order.user &&
            typeof order.user ===
              "object" &&
            "name" in
              order.user
              ? String(
                  order.user.name ||
                    ""
                )
              : "Customer",

          email:
            order.user &&
            typeof order.user ===
              "object" &&
            "email" in
              order.user
              ? String(
                  order.user.email ||
                    ""
                )
              : "",

          totalAmount: Number(
            order.totalAmount ||
              0
          ),

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          createdAt:
            order.createdAt
              ? order.createdAt.toISOString()
              : null,
        })
      );

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        data: {
          stats: {
            totalMedicines,
            totalCustomers,
            totalOrders,
            lowStockMedicines,
            outOfStockMedicines,
            pendingOrders,
            totalRevenue:
              Number(
                totalRevenue.toFixed(2)
              ),
          },

          recentOrders:
            serializedRecentOrders,
        },

        message:
          "Dashboard statistics fetched successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Dashboard Stats API Error:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
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

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch dashboard statistics",
      },
      {
        status: 500,
      }
    );
  }
}