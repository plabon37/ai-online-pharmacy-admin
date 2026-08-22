import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectToDB } from "@/lib/connectToDB";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   CLIENT ORIGIN
============================================================ */

const CLIENT_ORIGIN = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3001"
).replace(
  /\/+$/,
  ""
);

/* ============================================================
   CORS
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
   TYPES
============================================================ */

type CustomerLoginRequest = {
  email?: string;
  password?: string;
};

type CustomerJwtPayload = {
  userId: string;
  email: string;
  role: "CUSTOMER";
};

/* ============================================================
   POST - CUSTOMER LOGIN
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. ORIGIN
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
       2. JWT SECRET
    ======================================================== */

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is not configured."
      );

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

    /* ========================================================
       3. BODY
    ======================================================== */

    const body =
      (await request.json()) as CustomerLoginRequest;

    const email =
      body.email
        ?.trim()
        .toLowerCase() || "";

    const password =
      body.password || "";

    /* ========================================================
       4. VALIDATION
    ======================================================== */

    if (
      !email ||
      !password
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Email and password are required",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       5. DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       6. CUSTOMER
       
       Only active customers can login.
    ======================================================== */

    const customer =
      await User.findOne({
        email,

        role: "CUSTOMER",

        isActive: true,
      }).select(
        "+password"
      );

    if (!customer) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid email or password",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       7. PASSWORD
    ======================================================== */

    const passwordValid =
      await bcrypt.compare(
        password,
        customer.password
      );

    if (!passwordValid) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid email or password",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       8. JWT
    ======================================================== */

    const payload:
      CustomerJwtPayload = {
      userId:
        customer._id.toString(),

      email:
        customer.email,

      role: "CUSTOMER",
    };

    const token =
      jwt.sign(
        payload,
        jwtSecret,
        {
          expiresIn: "7d",
        }
      );

    /* ========================================================
       9. RESPONSE
    ======================================================== */

    const response =
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
            "Customer login successful",
        },
        {
          status: 200,
        }
      );

    /* ========================================================
       10. COOKIE
       
       LOCAL:
       Client and backend are localhost with different ports.
       SameSite=Lax is sufficient.

       PRODUCTION:
       Client and backend are usually different sites/origins.
       SameSite=None + Secure is required for cross-site
       credentialed requests.
    ======================================================== */

    const isProduction =
      process.env.NODE_ENV ===
      "production";

    response.cookies.set(
      "customer_token",
      token,
      {
        httpOnly: true,

        secure:
          isProduction,

        sameSite:
          isProduction
            ? "none"
            : "lax",

        path: "/",

        maxAge:
          60 *
          60 *
          24 *
          7,
      }
    );

    return applyCors(
      response
    );
  } catch (error) {
    console.error(
      "Customer Login Error:",
      error
    );

    return applyCors(
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Something went wrong while logging in",
        },
        {
          status: 500,
        }
      )
    );
  }
}