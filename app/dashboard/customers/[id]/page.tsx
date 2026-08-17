import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";
import Order from "@/lib/models/Order";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    requireAdmin(request);

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const customer = await User.findOne({
      _id: id,
      role: {
        $ne: "ADMIN",
      },
    })
      .select(
        "_id name email role createdAt updatedAt"
      )
      .lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const orders = await Order.find({
      user: id,
    })
      .select(
        "_id totalAmount status paymentStatus createdAt updatedAt items"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const totalSpent = orders.reduce(
      (total, order) => {
        if (order.status === "CANCELLED") {
          return total;
        }

        return (
          total +
          Number(order.totalAmount || 0)
        );
      },
      0
    );

    const totalOrders = orders.length;

    const deliveredOrders =
      orders.filter(
        (order) =>
          order.status === "DELIVERED"
      ).length;

    const cancelledOrders =
      orders.filter(
        (order) =>
          order.status === "CANCELLED"
      ).length;

    const serializedOrders =
      orders.map((order) => ({
        _id: order._id.toString(),

        totalAmount: Number(
          order.totalAmount || 0
        ),

        status: order.status,

        paymentStatus:
          order.paymentStatus,

        itemCount: order.items.reduce(
          (count, item) =>
            count +
            Number(item.quantity || 0),
          0
        ),

        createdAt:
          order.createdAt.toISOString(),

        updatedAt:
          order.updatedAt.toISOString(),
      }));

    return NextResponse.json(
      {
        success: true,

        data: {
          customer: {
            _id:
              customer._id.toString(),

            name:
              customer.name || "",

            email:
              customer.email || "",

            role:
              customer.role || "USER",

            createdAt:
              customer.createdAt
                ? customer.createdAt.toISOString()
                : null,

            updatedAt:
              customer.updatedAt
                ? customer.updatedAt.toISOString()
                : null,
          },

          summary: {
            totalOrders,

            deliveredOrders,

            cancelledOrders,

            totalSpent: Number(
              totalSpent.toFixed(2)
            ),
          },

          orders: serializedOrders,
        },

        message:
          "Customer details fetched successfully",
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
            message: "Unauthorized",
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
      { status: 500 }
    );
  }
}