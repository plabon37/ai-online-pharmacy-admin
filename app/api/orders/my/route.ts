import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import {
  connectToDB,
} from "@/lib/connectToDB";

import {
  requireCustomer,
} from "@/lib/auth/requireCustomer";

import Order from "@/lib/models/Order";

/* ============================================================
   CORS
============================================================ */

const CLIENT_ORIGIN = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3001"
).replace(
  /\/+$/,
  ""
);

/* ============================================================
   APPLY CORS
============================================================ */

function applyCors(
  response: NextResponse
) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    CLIENT_ORIGIN
  );

  response.headers.set(
    "Access-Control-Allow-Credentials",
    "true"
  );

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  response.headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  response.headers.set(
    "Vary",
    "Origin"
  );

  return response;
}

/* ============================================================
   ORIGIN VALIDATION
============================================================ */

function isAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return true;
  }

  return (
    origin.replace(
      /\/+$/,
      ""
    ) === CLIENT_ORIGIN
  );
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  if (
    !isAllowedOrigin(
      request
    )
  ) {
    return new NextResponse(
      null,
      {
        status: 403,
      }
    );
  }

  return applyCors(
    new NextResponse(
      null,
      {
        status: 204,
      }
    )
  );
}

/* ============================================================
   GET - CUSTOMER'S OWN ORDERS
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ORIGIN
    ======================================================== */

    if (
      !isAllowedOrigin(
        request
      )
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid client origin",
          },
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       CUSTOMER AUTHENTICATION
    ======================================================== */

    const customer =
      await requireCustomer(
        request
      );

    /* ========================================================
       RESOLVE CUSTOMER ID
    ======================================================== */

    const customerId =
      String(
        customer.id
      ).trim();

    if (
      !mongoose.isValidObjectId(
        customerId
      )
    ) {
      console.error(
        "[MY ORDERS] Invalid customer ID:",
        customer
      );

      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid customer account",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       DEBUG LOG
       
       This helps verify exactly which customer is being used.
    ======================================================== */

    console.log(
      "[MY ORDERS]",
      {
        customerId,
      }
    );

    /* ========================================================
       QUERY PARAMETERS
    ======================================================== */

    const searchParams =
      request.nextUrl.searchParams;

    const status =
      (
        searchParams.get(
          "status"
        ) || "ALL"
      )
        .trim()
        .toUpperCase();

    const paymentStatus =
      (
        searchParams.get(
          "paymentStatus"
        ) || "ALL"
      )
        .trim()
        .toUpperCase();

    /* ========================================================
       PAGINATION
    ======================================================== */

    const requestedPage =
      Number(
        searchParams.get(
          "page"
        ) || "1"
      );

    const requestedLimit =
      Number(
        searchParams.get(
          "limit"
        ) || "10"
      );

    const page =
      Number.isInteger(
        requestedPage
      ) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(
        requestedLimit
      ) &&
      requestedLimit > 0
        ? Math.min(
            requestedLimit,
            50
          )
        : 10;

    /* ========================================================
       CUSTOMER-ONLY FILTER
       
       CRITICAL SECURITY RULE:
       NEVER remove this user filter.
    ======================================================== */

    const filter: Record<
      string,
      unknown
    > = {
      user:
        new mongoose.Types.ObjectId(
          customerId
        ),
    };

    /* ========================================================
       STATUS FILTER
    ======================================================== */

    if (
      status !== "ALL"
    ) {
      filter.status =
        status;
    }

    /* ========================================================
       PAYMENT STATUS FILTER
    ======================================================== */

    if (
      paymentStatus !==
      "ALL"
    ) {
      filter.paymentStatus =
        paymentStatus;
    }

    /* ========================================================
       PAGINATION OFFSET
    ======================================================== */

    const skip =
      (page - 1) *
      limit;

    /* ========================================================
       FETCH CUSTOMER'S ORDERS
    ======================================================== */

    const [
      orders,
      totalOrders,
    ] = await Promise.all([
      Order.find(
        filter
      )
        .populate({
          path: "user",
          select:
            "name email",
        })
        .populate({
          path:
            "items.medicine",
          select:
            "name image price genericName",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(
        filter
      ),
    ]);

    /* ========================================================
       PAGINATION
    ======================================================== */

    const totalPages =
      totalOrders === 0
        ? 0
        : Math.ceil(
            totalOrders /
              limit
          );

    /* ========================================================
       DEBUG RESULT
    ======================================================== */

    console.log(
      "[MY ORDERS RESULT]",
      {
        customerId,
        totalOrders,
        orderIds:
          orders.map(
            (order) =>
              order._id.toString()
          ),
      }
    );

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      NextResponse.json(
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
                page <
                totalPages,

              hasPreviousPage:
                page > 1,
            },

            filters: {
              status,

              paymentStatus,
            },
          },

          message:
            "Your orders fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Get My Orders Error:",
      error
    );

    /* ========================================================
       AUTH ERROR
    ======================================================== */

    if (
      error instanceof
      Error
    ) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return applyCors(
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Unauthorized",
            },
            {
              status: 401,
            }
          )
        );
      }

      if (
        error.message ===
        "SERVER_CONFIG_ERROR"
      ) {
        return applyCors(
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Server configuration error",
            },
            {
              status: 500,
            }
          )
        );
      }

      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              error.message ||
              "Failed to fetch your orders",
          },
          {
            status: 500,
          }
        )
      );
    }

    /* ========================================================
       UNKNOWN ERROR
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to fetch your orders",
        },
        {
          status: 500,
        }
      )
    );
  }
}