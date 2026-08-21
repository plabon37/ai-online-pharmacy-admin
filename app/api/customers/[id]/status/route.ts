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

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   ROUTE CONTEXT
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   REQUEST BODY
============================================================ */

type UpdateCustomerStatusBody = {
  isActive?: boolean;
};

/* ============================================================
   PATCH
   ACTIVATE / DEACTIVATE CUSTOMER
============================================================ */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ========================================================
       ADMIN AUTH
       
       This same-origin route relies on the admin cookie.
       requireAdmin() is the actual authorization check.
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
       REQUEST BODY
    ======================================================== */

    let body:
      | UpdateCustomerStatusBody
      | null = null;

    try {
      body =
        (await request.json()) as UpdateCustomerStatusBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VALIDATE STATUS
    ======================================================== */

    if (
      typeof body.isActive !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "isActive must be a boolean",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       FIND CUSTOMER
       
       Admin accounts cannot be modified through this route.
    ======================================================== */

    const customer =
      await User.findOne({
        _id: id,
        role: "CUSTOMER",
      });

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
       UPDATE STATUS
    ======================================================== */

    customer.isActive =
      body.isActive;

    await customer.save();

    /* ========================================================
       SERIALIZED CUSTOMER
    ======================================================== */

    const serializedCustomer = {
      _id:
        customer._id.toString(),

      id:
        customer._id.toString(),

      name:
        customer.name || "",

      email:
        customer.email || "",

      role:
        customer.role,

      isActive:
        customer.isActive,

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
        },

        message:
          customer.isActive
            ? "Customer activated successfully"
            : "Customer deactivated successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update Customer Status Error:",
      error
    );

    /* ========================================================
       UNAUTHORIZED
    ======================================================== */

    if (
      error instanceof
      Error &&
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

    /* ========================================================
       FORBIDDEN
    ======================================================== */

    if (
      error instanceof
      Error &&
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

    /* ========================================================
       SERVER CONFIG
    ======================================================== */

    if (
      error instanceof
      Error &&
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

    /* ========================================================
       UNKNOWN ERROR
    ======================================================== */

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to update customer status",
      },
      {
        status: 500,
      }
    );
  }
}