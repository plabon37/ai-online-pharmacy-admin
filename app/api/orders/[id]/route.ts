import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Order, {
  OrderStatus,
  PaymentStatus,
} from "@/lib/models/Order";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateOrderBody = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

/* ============================================================
   GET SINGLE ORDER
============================================================ */

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
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const order = await Order.findById(id)
      .populate({
        path: "user",
        select: "name email",
      })
      .populate({
        path: "items.medicine",
        select: "name image price",
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
        message: "Order fetched successfully",
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

    console.error("Get Single Order Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE ORDER STATUS / PAYMENT STATUS
============================================================ */

export async function PUT(
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
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const body =
      (await request.json()) as UpdateOrderBody;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    /* --------------------------------------------------------
       Validate order status
    --------------------------------------------------------- */

    if (
      body.status !== undefined &&
      !ORDER_STATUSES.includes(body.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid order status",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Validate payment status
    --------------------------------------------------------- */

    if (
      body.paymentStatus !== undefined &&
      !PAYMENT_STATUSES.includes(
        body.paymentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid payment status",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Require at least one field
    --------------------------------------------------------- */

    if (
      body.status === undefined &&
      body.paymentStatus === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "At least one order field is required",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Update order status
    --------------------------------------------------------- */

    if (body.status !== undefined) {
      order.status = body.status;
    }

    /* --------------------------------------------------------
       Update payment status
    --------------------------------------------------------- */

    if (body.paymentStatus !== undefined) {
      order.paymentStatus = body.paymentStatus;
    }

    const updatedOrder = await order.save();

    /* --------------------------------------------------------
       Populate updated order
    --------------------------------------------------------- */

    const populatedOrder =
      await Order.findById(updatedOrder._id)
        .populate({
          path: "user",
          select: "name email",
        })
        .populate({
          path: "items.medicine",
          select: "name image price",
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedOrder,
        message: "Order updated successfully",
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

    console.error("Update Order Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to update order",
      },
      { status: 500 }
    );
  }
}