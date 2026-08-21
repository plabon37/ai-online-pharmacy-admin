import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import {
  connectToDB,
} from "@/lib/connectToDB";

import {
  requireAdmin,
} from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";
import Order from "@/lib/models/Order";

/* ============================================================
   ROUTE CONTEXT
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   GET CUSTOMER DETAILS
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    requireAdmin(
      request
    );

    /* ========================================================
       CUSTOMER ID
    ======================================================== */

    const { id } =
      await context.params;

    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid customer ID",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       CUSTOMER
       
       IMPORTANT:
       isActive is included here.
    ======================================================== */

    const customer =
      await User.findOne({
        _id: id,

        role: {
          $ne: "ADMIN",
        },
      })
        .select(
          "_id name email role isActive createdAt updatedAt"
        )
        .lean();

    /* ========================================================
       NOT FOUND
    ======================================================== */

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Customer not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ========================================================
       ORDERS
    ======================================================== */

    const orders =
      await Order.find({
        user: id,
      })
        .select(
          "_id totalAmount status paymentStatus createdAt updatedAt items"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    /* ========================================================
       SUMMARY
    ======================================================== */

    const totalSpent =
      orders.reduce(
        (
          total,
          order
        ) => {
          if (
            order.status ===
            "CANCELLED"
          ) {
            return total;
          }

          return (
            total +
            Number(
              order.totalAmount ||
                0
            )
          );
        },
        0
      );

    const totalOrders =
      orders.length;

    const deliveredOrders =
      orders.filter(
        (
          order
        ) =>
          order.status ===
          "DELIVERED"
      ).length;

    const cancelledOrders =
      orders.filter(
        (
          order
        ) =>
          order.status ===
          "CANCELLED"
      ).length;

    /* ========================================================
       SERIALIZE ORDERS
    ======================================================== */

    const serializedOrders =
      orders.map(
        (
          order
        ) => ({
          _id:
            order._id.toString(),

          totalAmount:
            Number(
              order.totalAmount ||
                0
            ),

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          itemCount:
            order.items.reduce(
              (
                count,
                item
              ) =>
                count +
                Number(
                  item.quantity ||
                    0
                ),
              0
            ),

          createdAt:
            order.createdAt
              ? order.createdAt.toISOString()
              : null,

          updatedAt:
            order.updatedAt
              ? order.updatedAt.toISOString()
              : null,
        })
      );

    /* ========================================================
       CUSTOMER RESPONSE
       
       IMPORTANT:
       Return the REAL boolean from MongoDB.
    ======================================================== */

    const serializedCustomer = {
      _id:
        customer._id.toString(),

      name:
        customer.name || "",

      email:
        customer.email || "",

      role:
        customer.role || "USER",

      isActive:
        customer.isActive ===
        true,

      createdAt:
        customer.createdAt
          ? customer.createdAt.toISOString()
          : null,

      updatedAt:
        customer.updatedAt
          ? customer.updatedAt.toISOString()
          : null,
    };

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        data: {
          customer:
            serializedCustomer,

          summary: {
            totalOrders,

            deliveredOrders,

            cancelledOrders,

            totalSpent:
              Number(
                totalSpent.toFixed(
                  2
                )
              ),
          },

          orders:
            serializedOrders,
        },

        message:
          "Customer details fetched successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /* ========================================================
       AUTH ERRORS
    ======================================================== */

    if (
      error instanceof
      Error
    ) {
      /* ======================================================
         UNAUTHORIZED
      ======================================================= */

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

      /* ======================================================
         FORBIDDEN
      ======================================================= */

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

      /* ======================================================
         SERVER CONFIG
      ======================================================= */

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

    /* ========================================================
       UNKNOWN ERROR
    ======================================================== */

    console.error(
      "Get Customer Details Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch customer details",
      },
      {
        status: 500,
      }
    );
  }
}