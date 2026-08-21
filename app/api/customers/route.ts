import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  connectToDB,
} from "@/lib/connectToDB";

import {
  requireAdmin,
} from "@/lib/auth/requireAdmin";

import User from "@/lib/models/User";

export const dynamic =
  "force-dynamic";

/* ============================================================
   GET CUSTOMERS
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    requireAdmin(
      request
    );

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       QUERY PARAMS
    ======================================================== */

    const { searchParams } =
      new URL(
        request.url
      );

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const pageValue =
      Number(
        searchParams.get(
          "page"
        )
      );

    const limitValue =
      Number(
        searchParams.get(
          "limit"
        )
      );

    /* ========================================================
       PAGINATION
    ======================================================== */

    const page =
      Number.isInteger(
        pageValue
      ) &&
      pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(
        limitValue
      ) &&
      limitValue > 0 &&
      limitValue <= 100
        ? limitValue
        : 10;

    /* ========================================================
       BASE FILTER
       
       Keep ADMIN excluded from the customer list.
    ======================================================== */

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
      /*
       * Escape regex special characters safely.
       */
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex =
        new RegExp(
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

    /* ========================================================
       SKIP
    ======================================================== */

    const skip =
      (page - 1) *
      limit;

    /* ========================================================
       FETCH CUSTOMERS
       
       IMPORTANT:
       isActive is now included.
    ======================================================== */

    const [
      customers,
      totalCustomers,
    ] = await Promise.all([
      User.find(filter)
        .select(
          "_id name email role isActive createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(
        filter
      ),
    ]);

    /* ========================================================
       TOTAL PAGES
    ======================================================== */

    const totalPages =
      totalCustomers ===
      0
        ? 0
        : Math.ceil(
            totalCustomers /
              limit
          );

    /* ========================================================
       SERIALIZE
    ======================================================== */

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
            customer.role ||
            "USER",

          /*
           * IMPORTANT:
           *
           * Explicit boolean conversion ensures
           * frontend always receives true/false.
           */
          isActive:
            customer.isActive !==
            false,

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

    /* ========================================================
       SUCCESS
    ======================================================== */

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
              page <
              totalPages,

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
      {
        status: 200,
      }
    );
  } catch (error) {
    /* ========================================================
       KNOWN ERRORS
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
      {
        status: 500,
      }
    );
  }
}