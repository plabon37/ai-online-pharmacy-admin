import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";

import {
  connectToDB,
} from "@/lib/connectToDB";

import User from "@/lib/models/User";

export const runtime =
  "nodejs";

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
   ORIGIN CHECK
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
   GET
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. CORS
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
        "Customer session: JWT_SECRET missing"
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
       3. READ CUSTOMER COOKIE
    ======================================================== */

    const token =
      request.cookies.get(
        "customer_token"
      )?.value;

    if (!token) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Customer is not authenticated",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       4. VERIFY JWT
    ======================================================== */

    let decoded:
      | {
          userId: string;
          email: string;
          role: "CUSTOMER";
        }
      | null = null;

    try {
      decoded =
        jwt.verify(
          token,
          jwtSecret
        ) as {
          userId: string;
          email: string;
          role: "CUSTOMER";
        };
    } catch {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid or expired customer session",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       5. VERIFY CUSTOMER PAYLOAD
    ======================================================== */

    if (
      !decoded ||
      !decoded.userId ||
      !decoded.email ||
      decoded.role !==
        "CUSTOMER"
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid customer session",
          },
          {
            status: 401,
          }
        )
      );
    }

    /* ========================================================
       6. DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       7. GET ACTIVE CUSTOMER
    ======================================================== */

    const customer =
      await User.findOne({
        _id:
          decoded.userId,

        email:
          decoded.email,

        role: "CUSTOMER",

        isActive: true,
      }).select(
        "_id name email role isActive"
      );

    if (!customer) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Customer account is not active",
          },
          {
            status: 401,
          }
        )
      );
    }

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
            "Customer session is valid",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Customer Session Error:",
      error
    );

    return applyCors(
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to verify customer session",
        },
        {
          status: 500,
        }
      )
    );
  }
}