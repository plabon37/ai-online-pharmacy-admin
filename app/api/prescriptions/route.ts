import {
  NextRequest,
  NextResponse,
} from "next/server";

import cloudinary from "@/lib/cloudinary";

import {
  connectToDB,
} from "@/lib/connectToDB";

import {
  requireAdmin,
} from "@/lib/auth/requireAdmin";

import {
  requireCustomer,
} from "@/lib/auth/requireCustomer";

import Prescription from "@/lib/models/Prescription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   FILE CONFIG
============================================================ */

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);

/* ============================================================
   CORS / ORIGINS
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
    "GET, POST, OPTIONS"
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
   GET
   ADMIN ONLY

   Returns all prescriptions.
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
       FETCH PRESCRIPTIONS
    ======================================================== */

    const prescriptions =
      await Prescription.find({})
        .populate({
          path: "user",
          select:
            "name email role isActive",
        })
        .populate({
          path: "reviewedBy",
          select:
            "name email role",
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
            "Prescriptions fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
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
    }

    console.error(
      "Get Prescriptions Error:",
      error
    );

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to fetch prescriptions",
        },
        {
          status: 500,
        }
      )
    );
  }
}

/* ============================================================
   POST
   CUSTOMER ONLY

   Upload:
   - JPG
   - PNG
   - WebP
   - PDF

   Flow:
   Customer
      ↓
   Cloudinary
      ↓
   Prescription MongoDB record
      ↓
   aiStatus = PENDING
============================================================ */

export async function POST(
  request: NextRequest
) {
  let uploadedPublicId:
    | string
    | null = null;

  let uploadedResourceType:
    | "image"
    | "raw"
    | null = null;

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
       FORM DATA
    ======================================================== */

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const patientName =
      formData
        .get(
          "patientName"
        )
        ?.toString()
        .trim() || "";

    const note =
      formData
        .get("note")
        ?.toString()
        .trim() || "";

    /* ========================================================
       FILE VALIDATION
    ======================================================== */

    if (
      !(
        file instanceof
        File
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Prescription image or PDF is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      !ALLOWED_FILE_TYPES.has(
        file.type
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Only JPG, PNG, WebP and PDF files are allowed",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      file.size <= 0
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Selected file is empty",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Prescription file size must be 10MB or less",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       PATIENT NAME VALIDATION
    ======================================================== */

    if (!patientName) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Patient name is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      patientName.length <
      2
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Patient name must be at least 2 characters long",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      patientName.length >
      100
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Patient name cannot exceed 100 characters",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       NOTE VALIDATION
    ======================================================== */

    if (
      note.length >
      1000
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Note cannot exceed 1000 characters",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       FILE TYPE
    ======================================================== */

    const fileType =
      file.type ===
      "application/pdf"
        ? "PDF"
        : "IMAGE";

    /* ========================================================
       CLOUDINARY RESOURCE TYPE
       
       Image → image
       PDF   → raw
    ======================================================== */

    const resourceType =
      fileType === "PDF"
        ? "raw"
        : "image";

    uploadedResourceType =
      resourceType;

    /* ========================================================
       BUFFER
    ======================================================== */

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    const base64 =
      buffer.toString(
        "base64"
      );

    const dataUri =
      `data:${file.type};base64,${base64}`;

    /* ========================================================
       CLOUDINARY UPLOAD
    ======================================================== */

    const uploadResult =
      await cloudinary.uploader.upload(
        dataUri,
        {
          folder:
            "smart-pharmacy/prescriptions",

          resource_type:
            resourceType,

          ...(resourceType ===
          "image"
            ? {
                transformation: [
                  {
                    quality:
                      "auto",

                    fetch_format:
                      "auto",
                  },
                ],
              }
            : {}),
        }
      );

    uploadedPublicId =
      uploadResult.public_id;

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       CREATE PRESCRIPTION
    ======================================================== */

    const prescription =
      await Prescription.create({
        user:
          customer.id,

        patientName,

        image:
          uploadResult.secure_url,

        fileType,

        originalFileName:
          file.name,

        note,

        adminNote:
          "",

        extractedText:
          "",

        medicines:
          [],

        tests:
          [],

        aiStatus:
          "PENDING",

        status:
          "PENDING",

        reviewedBy:
          null,

        reviewedAt:
          null,
      });

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data: {
            prescription: {
              _id:
                prescription._id.toString(),

              user:
                prescription.user.toString(),

              patientName:
                prescription.patientName,

              image:
                prescription.image,

              fileType:
                prescription.fileType,

              originalFileName:
                prescription.originalFileName ||
                "",

              note:
                prescription.note ||
                "",

              adminNote:
                prescription.adminNote ||
                "",

              extractedText:
                prescription.extractedText ||
                "",

              medicines:
                prescription.medicines,

              tests:
                prescription.tests,

              aiStatus:
                prescription.aiStatus,

              status:
                prescription.status,

              reviewedBy:
                prescription.reviewedBy,

              reviewedAt:
                prescription.reviewedAt,

              createdAt:
                prescription.createdAt.toISOString(),

              updatedAt:
                prescription.updatedAt.toISOString(),
            },
          },

          message:
            "Prescription uploaded successfully",
        },
        {
          status: 201,
        }
      )
    );
  } catch (error) {
    /* ========================================================
       LOG ERROR
    ======================================================== */

    console.error(
      "Prescription API Error:",
      error
    );

    /* ========================================================
       CLOUDINARY CLEANUP
       
       If upload succeeded but DB failed, remove the file.
    ======================================================== */

    if (
      uploadedPublicId &&
      uploadedResourceType
    ) {
      try {
        await cloudinary.uploader.destroy(
          uploadedPublicId,
          {
            resource_type:
              uploadedResourceType,
          }
        );
      } catch (cleanupError) {
        console.error(
          "Cloudinary Cleanup Error:",
          cleanupError
        );
      }
    }

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
    }

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to upload prescription",
        },
        {
          status: 500,
        }
      )
    );
  }
}