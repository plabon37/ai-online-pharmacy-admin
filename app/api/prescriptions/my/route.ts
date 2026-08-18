import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  connectToDB,
} from "@/lib/connectToDB";

import {
  requireCustomer,
} from "@/lib/auth/requireCustomer";

import Prescription from "@/lib/models/Prescription";

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

const ADMIN_ORIGIN = (
  process.env.ADMIN_ORIGIN ||
  "http://localhost:3000"
).replace(
  /\/+$/,
  ""
);

const ALLOWED_ORIGINS =
  new Set<string>([
    CLIENT_ORIGIN,
    ADMIN_ORIGIN,
  ]);

/* ============================================================
   CORS HELPERS
============================================================ */

function getAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return null;
  }

  const normalizedOrigin =
    origin.replace(
      /\/+$/,
      ""
    );

  return ALLOWED_ORIGINS.has(
    normalizedOrigin
  )
    ? normalizedOrigin
    : null;
}

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
    getAllowedOrigin(
      request
    ) !== null
  );
}

function applyCors(
  request: NextRequest,
  response: NextResponse
) {
  const origin =
    getAllowedOrigin(
      request
    );

  if (origin) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      origin
    );

    response.headers.set(
      "Access-Control-Allow-Credentials",
      "true"
    );

    response.headers.set(
      "Vary",
      "Origin"
    );
  }

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

  return response;
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
    request,
    new NextResponse(
      null,
      {
        status: 204,
      }
    )
  );
}

/* ============================================================
   GET MY PRESCRIPTIONS
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
        request,
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
       CUSTOMER AUTH
    ======================================================== */

    const customer =
      await requireCustomer(
        request
      );

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       FETCH ONLY CURRENT CUSTOMER'S PRESCRIPTIONS
    ======================================================== */

    const prescriptions =
      await Prescription.find({
        user: customer.id,
      })
        .select(
          [
            "_id",
            "patientName",
            "image",
            "note",
            "adminNote",
            "status",
            "reviewedAt",
            "createdAt",
            "updatedAt",
            "extractedText",
            "cleanedText",
            "medicines",
            "tests",
            "aiStatus",
          ].join(" ")
        )
        .populate({
          path:
            "medicines.matchedMedicineId",
          select:
            "name genericName price stock image category isActive",
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data:
            prescriptions,

          message:
            "Your prescriptions fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Get My Prescriptions Error:",
      error
    );

    /* ========================================================
       AUTH ERRORS
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
          request,
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
          request,
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
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              error.message ||
              "Failed to fetch your prescriptions",
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
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to fetch your prescriptions",
        },
        {
          status: 500,
        }
      )
    );
  }
}