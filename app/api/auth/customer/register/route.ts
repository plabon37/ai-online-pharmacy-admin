import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { connectToDB } from "@/lib/connectToDB";
import User from "@/lib/models/User";

export const runtime = "nodejs";

/* ============================================================
   CORS
============================================================ */

const DEFAULT_CLIENT_ORIGIN =
  "http://localhost:3001";

function getClientOrigin() {
  return (
    process.env.CLIENT_ORIGIN?.trim() ||
    DEFAULT_CLIENT_ORIGIN
  ).replace(/\/+$/, "");
}

function applyCors(
  response: NextResponse
) {
  const clientOrigin =
    getClientOrigin();

  response.headers.set(
    "Access-Control-Allow-Origin",
    clientOrigin
  );

  response.headers.set(
    "Access-Control-Allow-Credentials",
    "true"
  );

  response.headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
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

function isAllowedOrigin(
  request: NextRequest
) {
  const requestOrigin =
    request.headers.get(
      "origin"
    );

  if (!requestOrigin) {
    return true;
  }

  return (
    requestOrigin.replace(
      /\/+$/,
      ""
    ) === getClientOrigin()
  );
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  if (!isAllowedOrigin(request)) {
    return new NextResponse(
      null,
      { status: 403 }
    );
  }

  return applyCors(
    new NextResponse(
      null,
      { status: 204 }
    )
  );
}

/* ============================================================
   TYPES
============================================================ */

type RegisterRequestBody = {
  name?: string;
  email?: string;
  password?: string;
};

/* ============================================================
   POST
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. CORS CHECK
    ======================================================== */

    if (!isAllowedOrigin(request)) {
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
       2. READ BODY
    ======================================================== */

    const body =
      (await request.json()) as RegisterRequestBody;

    const name =
      body.name?.trim() || "";

    const email =
      body.email
        ?.trim()
        .toLowerCase() || "";

    const password =
      body.password || "";

    /* ========================================================
       3. VALIDATION
    ======================================================== */

    if (!name) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Name is required",
          },
          { status: 400 }
        )
      );
    }

    if (name.length < 2) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Name must be at least 2 characters long",
          },
          { status: 400 }
        )
      );
    }

    if (name.length > 100) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Name cannot exceed 100 characters",
          },
          { status: 400 }
        )
      );
    }

    if (!email) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Email is required",
          },
          { status: 400 }
        )
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(email)
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Please enter a valid email address",
          },
          { status: 400 }
        )
      );
    }

    if (!password) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Password is required",
          },
          { status: 400 }
        )
      );
    }

    if (password.length < 6) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Password must be at least 6 characters long",
          },
          { status: 400 }
        )
      );
    }

    /* ========================================================
       4. DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       5. CHECK EXISTING USER
    ======================================================== */

    const existingUser =
      await User.findOne({
        email,
      }).select("_id");

    if (existingUser) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "An account with this email already exists",
          },
          { status: 409 }
        )
      );
    }

    /* ========================================================
       6. HASH PASSWORD
    ======================================================== */

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    /* ========================================================
       7. CREATE CUSTOMER
    ======================================================== */

    const customer =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
        role: "CUSTOMER",
        isActive: true,
      });

    /* ========================================================
       8. SUCCESS
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: true,

          data: {
            user: {
              id:
                customer._id.toString(),

              name:
                customer.name,

              email:
                customer.email,

              role:
                customer.role,

              isActive:
                customer.isActive,
            },
          },

          message:
            "Customer registration successful",
        },
        { status: 201 }
      )
    );
  } catch (error) {
    /* ========================================================
       DUPLICATE
    ======================================================== */

    if (
      error &&
      typeof error ===
        "object" &&
      "code" in error &&
      (
        error as {
          code?: number;
        }
      ).code === 11000
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "An account with this email already exists",
          },
          { status: 409 }
        )
      );
    }

    /* ========================================================
       SERVER ERROR
    ======================================================== */

    console.error(
      "Customer Registration Error:",
      error
    );

    return applyCors(
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Something went wrong while creating the customer account",
        },
        { status: 500 }
      )
    );
  }
}