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

import Prescription from "@/lib/models/Prescription";

import Medicine from "@/lib/models/Medicine";

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

type MatchMedicineBody = {
  medicineIndex?: number;

  matchedMedicineId?:
    | string
    | null;
};

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
   ORIGIN HELPERS
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
    "GET, PUT, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  return response;
}

/* ============================================================
   POPULATED PRESCRIPTION
============================================================ */

async function getPrescription(
  id: string
) {
  return Prescription.findById(
    id
  )
    .populate({
      path:
        "medicines.matchedMedicineId",
      select:
        "name genericName price stock image isActive category",
    })
    .populate({
      path: "user",
      select:
        "name email role",
    })
    .populate({
      path:
        "reviewedBy",
      select:
        "name email role",
    })
    .lean();
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
   GET MEDICINE OPTIONS
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
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
       ADMIN
    ======================================================== */

    requireAdmin(
      request
    );

    /* ========================================================
       ID
    ======================================================== */

    const { id } =
      await context.params;

    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid prescription ID",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       CHECK PRESCRIPTION
    ======================================================== */

    const prescription =
      await Prescription.findById(
        id
      )
        .select(
          "_id medicines"
        )
        .lean();

    if (!prescription) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Prescription not found",
          },
          {
            status: 404,
          }
        )
      );
    }

    /* ========================================================
       SEARCH
    ======================================================== */

    const searchParams =
      request.nextUrl.searchParams;

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    const limitValue =
      Number(
        searchParams.get(
          "limit"
        ) || 30
      );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.isFinite(
          limitValue
        )
          ? limitValue
          : 30
      )
    );

    /* ========================================================
       QUERY
    ======================================================== */

    const query: Record<
      string,
      unknown
    > = {
      isActive: true,
    };

    if (search) {
      const escaped =
        escapeRegex(
          search
        );

      query.$or = [
        {
          name: {
            $regex:
              escaped,
            $options:
              "i",
          },
        },
        {
          genericName: {
            $regex:
              escaped,
            $options:
              "i",
          },
        },
      ];
    }

    /* ========================================================
       MEDICINES
    ======================================================== */

    const medicines =
      await Medicine.find(
        query
      )
        .select(
          "_id name genericName price stock image isActive category"
        )
        .sort({
          name: 1,
        })
        .limit(limit)
        .lean();

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data: medicines,

          message:
            "Medicine options fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    return handleError(
      request,
      error,
      "Failed to fetch medicine options"
    );
  }
}

/* ============================================================
   PUT — UPDATE MATCH
============================================================ */

export async function PUT(
  request: NextRequest,
  context: RouteContext
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
       ADMIN
    ======================================================== */

    requireAdmin(
      request
    );

    /* ========================================================
       ID
    ======================================================== */

    const { id } =
      await context.params;

    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid prescription ID",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       BODY
    ======================================================== */

    let body:
      | MatchMedicineBody
      | null = null;

    try {
      body =
        (await request.json()) as MatchMedicineBody;
    } catch {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid request body",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       VALIDATE INDEX
    ======================================================== */

    const medicineIndex =
      Number(
        body.medicineIndex
      );

    if (
      !Number.isInteger(
        medicineIndex
      ) ||
      medicineIndex < 0
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid medicine index",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       VALIDATE MATCH ID
    ======================================================== */

    const matchedMedicineId =
      body.matchedMedicineId ??
      null;

    if (
      matchedMedicineId !==
        null &&
      !mongoose.isValidObjectId(
        matchedMedicineId
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid matched medicine ID",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       PRESCRIPTION
    ======================================================== */

    const prescription =
      await Prescription.findById(
        id
      );

    if (!prescription) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Prescription not found",
          },
          {
            status: 404,
          }
        )
      );
    }

    /* ========================================================
       MEDICINE INDEX
    ======================================================== */

    if (
      medicineIndex >=
      prescription.medicines.length
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Medicine index is out of range",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       VERIFY TARGET MEDICINE
    ======================================================== */

    if (
      matchedMedicineId
    ) {
      const medicine =
        await Medicine.findOne({
          _id:
            matchedMedicineId,

          isActive:
            true,
        })
          .select(
            "_id name genericName price stock image isActive category"
          )
          .lean();

      if (!medicine) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Selected medicine was not found or is inactive",
            },
            {
              status: 404,
            }
          )
        );
      }
    }

    /* ========================================================
       UPDATE
    ======================================================== */

    prescription.medicines[
      medicineIndex
    ].matchedMedicineId =
      matchedMedicineId
        ? new mongoose.Types.ObjectId(
            matchedMedicineId
          )
        : null;

    /*
     * Manual admin selection means the match has been reviewed.
     *
     * A selected medicine can be considered reviewed.
     * Removing a match requires review again.
     */

    prescription.medicines[
      medicineIndex
    ].needsReview =
      matchedMedicineId
        ? false
        : true;

    /*
     * Manual matching is stronger than an AI fuzzy match,
     * but we keep a separate confidence convention:
     * 1 = admin-confirmed.
     */

    prescription.medicines[
      medicineIndex
    ].confidence =
      matchedMedicineId
        ? 1
        : prescription
            .medicines[
            medicineIndex
          ].confidence;

    /* ========================================================
       SAVE
    ======================================================== */

    await prescription.save();

    /* ========================================================
       FETCH POPULATED
    ======================================================== */

    const updatedPrescription =
      await Prescription.findById(
        prescription._id
      )
        .populate({
          path:
            "medicines.matchedMedicineId",
          select:
            "name genericName price stock image isActive category",
        })
        .populate({
          path: "user",
          select:
            "name email role",
        })
        .populate({
          path:
            "reviewedBy",
          select:
            "name email role",
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
            updatedPrescription,

          message:
            matchedMedicineId
              ? "Medicine match updated successfully"
              : "Medicine match removed successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    return handleError(
      request,
      error,
      "Failed to update medicine match"
    );
  }
}

/* ============================================================
   REGEX ESCAPE
============================================================ */

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* ============================================================
   ERROR HANDLER
============================================================ */

function handleError(
  request: NextRequest,
  error: unknown,
  fallbackMessage: string
) {
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
      "FORBIDDEN"
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Admin access required",
          },
          {
            status: 403,
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

    console.error(
      "Medicine Match API Error:",
      error
    );

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            error.message ||
            fallbackMessage,
        },
        {
          status: 500,
        }
      )
    );
  }

  console.error(
    "Medicine Match API Error:",
    error
  );

  return applyCors(
    request,
    NextResponse.json(
      {
        success: false,
        data: null,
        message:
          fallbackMessage,
      },
      {
        status: 500,
      }
    )
  );
}