import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const pageValue =
      Number(
        searchParams.get("page")
      );

    const limitValue =
      Number(
        searchParams.get("limit")
      );

    const page =
      Number.isInteger(pageValue) &&
      pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0 &&
      limitValue <= 100
        ? limitValue
        : 10;

    const filter: Record<
      string,
      unknown
    > = {
      role: {
        $ne: "ADMIN",
      },
    };

    /* ========================================================
       SEARCH
    ======================================================== */

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex = new RegExp(
        escapedSearch,
        "i"
      );

      filter.$or = [
        {
          name: regex,
        },
        {
          email: regex,
        },
      ];
    }

    const skip =
      (page - 1) * limit;

    const [
      customers,
      totalCustomers,
    ] = await Promise.all([
      User.find(filter)
        .select(
          "_id name email role createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const totalPages =
      totalCustomers === 0
        ? 0
        : Math.ceil(
            totalCustomers / limit
          );

    const serializedCustomers =
      customers.map(
        (customer) => ({
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
        })
      );

    return NextResponse.json(
      {
        success: true,

        data: {
          customers:
            serializedCustomers,

          pagination: {
            page,

            limit,

            totalCustomers,

            totalPages,

            hasNextPage:
              page < totalPages,

            hasPreviousPage:
              page > 1,
          },

          filters: {
            search,
          },
        },

        message:
          "Customers fetched successfully",
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
            message:
              "Unauthorized",
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
      "Get Customers Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}