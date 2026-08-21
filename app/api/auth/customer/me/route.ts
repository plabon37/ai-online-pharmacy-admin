import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireCustomer,
} from "@/lib/auth/requireCustomer";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   CLIENT ORIGIN
============================================================ */

function getClientOrigin() {
  return (
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:3001"
  ).replace(
    /\/+$/,
    ""
  );
}

/* ============================================================
   CORS
============================================================ */

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

  /*
   * Same-origin/server request may not contain Origin.
   */
  if (!origin) {
    return true;
  }

  return (
    origin.replace(
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
   GET - CURRENT CUSTOMER SESSION
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
       ACTIVE CUSTOMER AUTH
       
       requireCustomer() checks:

       - customer_token
       - JWT validity
       - CUSTOMER role
       - customer exists
       - isActive === true
    ======================================================== */

    const customer =
      await requireCustomer(
        request
      );

    /* ========================================================
       SUCCESS
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: true,

          data: {
            customer,
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
      "Customer Session Check Error:",
      error
    );

    /* ========================================================
       UNAUTHORIZED / INACTIVE
    ======================================================== */

    if (
      error instanceof
        Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      const response =
        NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Customer session is invalid or inactive",
          },
          {
            status: 401,
          }
        );

      /*
       * Clear old customer token.
       */

      response.cookies.set(
        "customer_token",
        "",
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "lax",

          path: "/",

          maxAge: 0,
        }
      );

      return applyCors(
        response
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
       UNKNOWN ERROR
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Unable to verify customer session",
        },
        {
          status: 500,
        }
      )
    );
  }
}