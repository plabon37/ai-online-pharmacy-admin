import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

/* ============================================================
   CLIENT ORIGIN
============================================================ */

function getClientOrigin() {
  const origin =
    process.env.CLIENT_ORIGIN?.trim();

  if (!origin) {
    throw new Error(
      "SERVER_CONFIG_ERROR"
    );
  }

  return origin.replace(
    /\/+$/,
    ""
  );
}

/* ============================================================
   APPLY CORS
============================================================ */

function applyCors(
  response: NextResponse,
  clientOrigin: string
) {
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
    "Vary",
    "Origin"
  );

  return response;
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  try {
    const clientOrigin =
      getClientOrigin();

    const requestOrigin =
      request.headers.get(
        "origin"
      );

    /* ========================================================
       VALIDATE ORIGIN
    ======================================================== */

    if (
      requestOrigin &&
      requestOrigin !==
        clientOrigin
    ) {
      return new NextResponse(
        null,
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       PREFLIGHT RESPONSE
    ======================================================== */

    const response =
      new NextResponse(
        null,
        {
          status: 204,
        }
      );

    return applyCors(
      response,
      clientOrigin
    );
  } catch (error) {
    console.error(
      "Customer Logout OPTIONS Error:",
      error
    );

    return new NextResponse(
      null,
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST - CUSTOMER LOGOUT
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       CLIENT ORIGIN
    ======================================================== */

    const clientOrigin =
      getClientOrigin();

    /* ========================================================
       REQUEST ORIGIN
    ======================================================== */

    const requestOrigin =
      request.headers.get(
        "origin"
      );

    console.log(
      "[CUSTOMER LOGOUT] POST",
      {
        requestOrigin,
        clientOrigin,
      }
    );

    /* ========================================================
       VALIDATE ORIGIN
    ======================================================== */

    if (
      requestOrigin &&
      requestOrigin !==
        clientOrigin
    ) {
      const response =
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
        );

      return applyCors(
        response,
        clientOrigin
      );
    }

    /* ========================================================
       SUCCESS RESPONSE
    ======================================================== */

    const response =
      NextResponse.json(
        {
          success: true,
          data: null,
          message:
            "Customer logout successful",
        },
        {
          status: 200,
        }
      );

    /* ========================================================
       CLEAR CUSTOMER TOKEN
    ======================================================== */

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

        expires:
          new Date(0),
      }
    );

    /* ========================================================
       APPLY CORS
    ======================================================== */

    return applyCors(
      response,
      clientOrigin
    );
  } catch (error) {
    console.error(
      "Customer Logout Error:",
      error
    );

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

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to logout",
      },
      {
        status: 500,
      }
    );
  }
}