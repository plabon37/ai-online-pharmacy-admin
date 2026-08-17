import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Order from "@/lib/models/Order";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const VALID_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const VALID_PAYMENT_STATUSES = new Set([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    await connectToDB();

    const searchParams =
      request.nextUrl.searchParams;

    const pageParam =
      searchParams.get("page");

    const limitParam =
      searchParams.get("limit");

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status")?.trim() || "ALL";

    const paymentStatus =
      searchParams
        .get("paymentStatus")
        ?.trim() || "ALL";

    const requestedPage = Number(pageParam);

    const requestedLimit = Number(limitParam);

    const page =
      Number.isInteger(requestedPage) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(
            requestedLimit,
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    /* --------------------------------------------------------
       Validate filters
    --------------------------------------------------------- */

    if (
      status !== "ALL" &&
      !VALID_STATUSES.has(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid order status filter",
        },
        { status: 400 }
      );
    }

    if (
      paymentStatus !== "ALL" &&
      !VALID_PAYMENT_STATUSES.has(
        paymentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid payment status filter",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Build MongoDB filter
    --------------------------------------------------------- */

    const filter: Record<
      string,
      unknown
    > = {};

    if (status !== "ALL") {
      filter.status = status;
    }

    if (paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }

    /* --------------------------------------------------------
       Search
       
       Customer name/email are populated fields, so we first
       find matching users through the User collection.
    --------------------------------------------------------- */

    if (search) {
      const User = (
        await import("@/lib/models/User")
      ).default;

      const matchingUsers =
        await User.find({
          $or: [
            {
              name: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
            {
              email: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
          ],
        })
          .select("_id")
          .lean();

      const userIds = matchingUsers.map(
        (user) => user._id
      );

      const orConditions: Record<
        string,
        unknown
      >[] = [
        {
          items: {
            $elemMatch: {
              name: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
          },
        },
      ];

      if (userIds.length > 0) {
        orConditions.push({
          user: {
            $in: userIds,
          },
        });
      }

      if (
        /^[a-f\d]{24}$/i.test(search)
      ) {
        orConditions.push({
          _id: search,
        });
      }

      filter.$or = orConditions;
    }

    /* --------------------------------------------------------
       Pagination
    --------------------------------------------------------- */

    const skip = (page - 1) * limit;

    const [orders, totalOrders] =
      await Promise.all([
        Order.find(filter)
          .populate({
            path: "user",
            select: "name email",
          })
          .populate({
            path: "items.medicine",
            select: "name image price",
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(filter),
      ]);

    const totalPages =
      totalOrders === 0
        ? 0
        : Math.ceil(
            totalOrders / limit
          );

    return NextResponse.json(
      {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            totalOrders,
            totalPages,
            hasNextPage:
              page < totalPages,
            hasPreviousPage:
              page > 1,
          },
          filters: {
            search,
            status,
            paymentStatus,
          },
        },
        message:
          "Orders fetched successfully",
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
      "Get Orders Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}