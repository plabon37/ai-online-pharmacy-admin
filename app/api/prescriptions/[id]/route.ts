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

import {
  requireCustomer,
} from "@/lib/auth/requireCustomer";

import cloudinary from "@/lib/cloudinary";

import Prescription, {
  PrescriptionStatus,
} from "@/lib/models/Prescription";

/* ============================================================
   ROUTE CONTEXT
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   UPDATE BODY
============================================================ */

type UpdatePrescriptionBody = {
  status?: PrescriptionStatus;
  adminNote?: string;
};

/* ============================================================
   VALID STATUSES
============================================================ */

const VALID_STATUSES: PrescriptionStatus[] = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
];

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
    "GET, POST, PUT, DELETE, OPTIONS"
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
   POPULATED PRESCRIPTION
============================================================ */

async function getPopulatedPrescription(
  id: string
) {
  return Prescription.findById(
    id
  )
    .populate({
      path: "user",
      select:
        "name email role isActive",
    })
    .populate({
      path:
        "reviewedBy",
      select:
        "name email role",
    })
    .populate({
      path:
        "medicines.matchedMedicineId",
      select:
        "name genericName price stock image isActive category",
    })
    .lean();
}

/* ============================================================
   CLOUDINARY PUBLIC ID EXTRACTOR
============================================================ */

function extractCloudinaryPublicId(
  imageUrl: string
) {
  try {
    if (!imageUrl) {
      return null;
    }

    if (
      !imageUrl.includes(
        "res.cloudinary.com"
      )
    ) {
      return null;
    }

    const parsedUrl =
      new URL(
        imageUrl
      );

    const pathname =
      parsedUrl.pathname;

    /*
     * Example:
     *
     * /demo/image/upload/v1234567890/
     * smart-pharmacy/prescriptions/file.jpg
     *
     * We need:
     *
     * smart-pharmacy/prescriptions/file
     */

    const uploadMarker =
      "/upload/";

    const uploadIndex =
      pathname.indexOf(
        uploadMarker
      );

    if (
      uploadIndex ===
      -1
    ) {
      return null;
    }

    let publicPath =
      pathname.slice(
        uploadIndex +
          uploadMarker.length
      );

    publicPath =
      publicPath.replace(
        /^v\d+\//,
        ""
      );

    /*
     * Remove transformation folders if present.
     *
     * Example:
     * c_fill,w_800,q_auto/v123/...
     */

    publicPath =
      publicPath.replace(
        /^(?:[^/]+\/)*v\d+\//,
        ""
      );

    /*
     * Remove file extension.
     */

    publicPath =
      publicPath.replace(
        /\.(jpg|jpeg|png|webp|gif|pdf)$/i,
        ""
      );

    publicPath =
      publicPath.replace(
        /^\/+/,
        ""
      );

    return publicPath ||
      null;
  } catch (
    error
  ) {
    console.warn(
      "Cloudinary public ID extraction failed:",
      error
    );

    return null;
  }
}

/* ============================================================
   DELETE CLOUDINARY FILE
============================================================ */

async function deleteCloudinaryFile(
  imageUrl: string
) {
  const publicId =
    extractCloudinaryPublicId(
      imageUrl
    );

  if (!publicId) {
    return {
      attempted: false,
      deleted: false,
    };
  }

  /*
   * Prescription uploads may be stored as images.
   *
   * Try image first.
   */

  try {
    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "image",
          invalidate:
            true,
        }
      );

    if (
      result.result ===
      "ok"
    ) {
      return {
        attempted: true,
        deleted: true,
      };
    }
  } catch (
    error
  ) {
    console.warn(
      "Cloudinary image deletion failed:",
      error
    );
  }

  /*
   * If image deletion didn't work, try raw.
   *
   * This is useful when the prescription was uploaded as a PDF.
   */

  try {
    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "raw",
          invalidate:
            true,
        }
      );

    if (
      result.result ===
      "ok"
    ) {
      return {
        attempted: true,
        deleted: true,
      };
    }
  } catch (
    error
  ) {
    console.warn(
      "Cloudinary raw deletion failed:",
      error
    );
  }

  return {
    attempted: true,
    deleted: false,
  };
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
   GET SINGLE PRESCRIPTION
   ADMIN ONLY
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
       ADMIN AUTH
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
       FETCH
    ======================================================== */

    const prescription =
      await getPopulatedPrescription(
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
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,
          data: prescription,
          message:
            "Prescription fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    return handleRouteError(
      request,
      error,
      "Failed to fetch prescription"
    );
  }
}

/* ============================================================
   POST
   ADMIN + CUSTOMER OWN PRESCRIPTION

   AI FLOW:

   OCR
    ↓
   Cleaning
    ↓
   Medicine Extraction
    ↓
   Medicine Database Matching
    ↓
   Test Extraction
    ↓
   COMPLETED
============================================================ */

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  let prescriptionId =
    "";

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
       AUTH
    ======================================================== */

    let isAdmin =
      false;

    let customer:
      | Awaited<
          ReturnType<
            typeof requireCustomer
          >
        >
      | null = null;

    /* ========================================================
       TRY ADMIN
    ======================================================== */

    try {
      requireAdmin(
        request
      );

      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    /* ========================================================
       TRY CUSTOMER
    ======================================================== */

    if (!isAdmin) {
      try {
        customer =
          await requireCustomer(
            request
          );
      } catch (
        customerError
      ) {
        if (
          customerError instanceof
            Error &&
          customerError.message ===
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
                "Unauthorized",
            },
            {
              status: 401,
            }
          )
        );
      }
    }

    /* ========================================================
       ID
    ======================================================== */

    const { id } =
      await context.params;

    prescriptionId =
      id;

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
       FIND PRESCRIPTION
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
       CUSTOMER OWNERSHIP
    ======================================================== */

    if (
      !isAdmin &&
      customer &&
      prescription.user.toString() !==
        customer.id
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "You can only process your own prescription",
          },
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       PROCESSING LOCK
    ======================================================== */

    if (
      prescription.aiStatus ===
        "OCR_PROCESSING" ||
      prescription.aiStatus ===
        "AI_PROCESSING"
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Prescription AI processing is already running",
          },
          {
            status: 409,
          }
        )
      );
    }

    /* ========================================================
       RESET AI RESULT
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          aiStatus:
            "OCR_PROCESSING",

          extractedText:
            "",

          cleanedText:
            "",

          medicines:
            [],

          tests:
            [],
        },
      }
    );

    /* ========================================================
       GEMINI SERVICES
    ======================================================== */

    const {
      extractPrescriptionText,
      cleanPrescriptionText,
      extractMedicinesFromPrescription,
      extractTestsFromPrescription,
    } = await import(
      "@/lib/ai/gemini"
    );

    /* ========================================================
       MATCHING SERVICE
    ======================================================== */

    const {
      matchPrescriptionMedicines,
    } = await import(
      "@/lib/services/medicineMatching"
    );

    /* ========================================================
       STEP A — OCR
    ======================================================== */

    const ocrResult =
      await extractPrescriptionText(
        prescription.image,
        prescription.fileType
      );

    const rawText =
      ocrResult.extractedText.trim();

    if (!rawText) {
      throw new Error(
        "Gemini returned empty OCR text"
      );
    }

    /* ========================================================
       SAVE OCR
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          extractedText:
            rawText,

          aiStatus:
            "OCR_COMPLETED",
        },
      }
    );

    /* ========================================================
       STEP B — CLEAN TEXT
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          aiStatus:
            "AI_PROCESSING",
        },
      }
    );

    const cleanResult =
      await cleanPrescriptionText(
        rawText
      );

    const cleanedText =
      cleanResult.cleanedText.trim();

    if (!cleanedText) {
      throw new Error(
        "Gemini returned empty cleaned text"
      );
    }

    /* ========================================================
       SAVE CLEANED TEXT
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          extractedText:
            rawText,

          cleanedText:
            cleanedText,

          aiStatus:
            "AI_PROCESSING",
        },
      }
    );

    /* ========================================================
       STEP C — MEDICINE EXTRACTION
    ======================================================== */

    const medicineResult =
      await extractMedicinesFromPrescription(
        cleanedText
      );

    if (
      !medicineResult ||
      !Array.isArray(
        medicineResult.medicines
      )
    ) {
      throw new Error(
        "Invalid medicine extraction result"
      );
    }

    const extractedMedicines =
      medicineResult.medicines
        .map(
          (medicine) => ({
            name:
              medicine.name?.trim() ||
              "",

            strength:
              medicine.strength?.trim() ||
              "",

            dosage:
              medicine.dosage?.trim() ||
              "",

            frequency:
              medicine.frequency?.trim() ||
              "",

            duration:
              medicine.duration?.trim() ||
              "",

            matchedMedicineId:
              null,

            confidence:
              Number.isFinite(
                medicine.confidence
              )
                ? Math.min(
                    1,
                    Math.max(
                      0,
                      medicine.confidence
                    )
                  )
                : 0,

            needsReview:
              Boolean(
                medicine.needsReview
              ),
          })
        )
        .filter(
          (medicine) =>
            medicine.name.length >
            0
        );

    /* ========================================================
       STEP D — DATABASE MATCHING
    ======================================================== */

    const matchedMedicineResults =
      await matchPrescriptionMedicines(
        extractedMedicines
      );

    const medicines =
      matchedMedicineResults
        .map(
          (medicine) => ({
            name:
              medicine.name?.trim() ||
              "",

            strength:
              medicine.strength?.trim() ||
              "",

            dosage:
              medicine.dosage?.trim() ||
              "",

            frequency:
              medicine.frequency?.trim() ||
              "",

            duration:
              medicine.duration?.trim() ||
              "",

            matchedMedicineId:
              medicine.matchedMedicineId,

            confidence:
              Number.isFinite(
                medicine.confidence
              )
                ? Math.min(
                    1,
                    Math.max(
                      0,
                      medicine.confidence
                    )
                  )
                : 0,

            needsReview:
              medicine.matchType ===
                "EXACT_NAME"
                ? Boolean(
                    medicine.needsReview
                  )
                : true,
          })
        )
        .filter(
          (medicine) =>
            medicine.name.length >
            0
        );

    /* ========================================================
       SAVE MATCHED MEDICINES
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          medicines:
            medicines,

          aiStatus:
            "AI_PROCESSING",
        },
      }
    );

    /* ========================================================
       STEP E — TEST EXTRACTION
    ======================================================== */

    const testResult =
      await extractTestsFromPrescription(
        cleanedText
      );

    if (
      !testResult ||
      !Array.isArray(
        testResult.tests
      )
    ) {
      throw new Error(
        "Invalid test extraction result"
      );
    }

    const tests =
      testResult.tests
        .map(
          (test) => ({
            name:
              test.name?.trim() ||
              "",

            category:
              test.category?.trim() ||
              "Other",

            notes:
              test.notes?.trim() ||
              "",

            confidence:
              Number.isFinite(
                test.confidence
              )
                ? Math.min(
                    1,
                    Math.max(
                      0,
                      test.confidence
                    )
                  )
                : 0,

            needsReview:
              Boolean(
                test.needsReview
              ),
          })
        )
        .filter(
          (test) =>
            test.name.length >
            0
        );

    /* ========================================================
       STEP F — FINAL SAVE
    ======================================================== */

    await Prescription.updateOne(
      {
        _id:
          prescription._id,
      },
      {
        $set: {
          extractedText:
            rawText,

          cleanedText:
            cleanedText,

          medicines:
            medicines,

          tests:
            tests,

          aiStatus:
            "COMPLETED",
        },
      }
    );

    /* ========================================================
       FETCH FINAL POPULATED RESULT
    ======================================================== */

    const populatedPrescription =
      await getPopulatedPrescription(
        prescription._id.toString()
      );

    if (
      !populatedPrescription
    ) {
      throw new Error(
        "Prescription could not be loaded after AI processing"
      );
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data:
            populatedPrescription,

          message:
            "Prescription OCR, cleaning, medicine extraction, database matching and test extraction completed successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Prescription AI Processing Error:",
      error
    );

    /* ========================================================
       MARK FAILED
    ======================================================== */

    if (
      prescriptionId &&
      mongoose.isValidObjectId(
        prescriptionId
      )
    ) {
      try {
        await connectToDB();

        await Prescription.updateOne(
          {
            _id:
              prescriptionId,
          },
          {
            $set: {
              aiStatus:
                "FAILED",
            },
          }
        );
      } catch (
        statusError
      ) {
        console.error(
          "AI Status Update Error:",
          statusError
        );
      }
    }

    return handleRouteError(
      request,
      error,
      "Failed to process prescription"
    );
  }
}

/* ============================================================
   PUT
   ADMIN REVIEW
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
       ADMIN AUTH
    ======================================================== */

    const admin =
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
       BODY
    ======================================================== */

    let body:
      | UpdatePrescriptionBody
      | null = null;

    try {
      body =
        (await request.json()) as UpdatePrescriptionBody;
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
       FIND
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
       VALIDATE STATUS
    ======================================================== */

    if (
      body.status !==
        undefined &&
      !VALID_STATUSES.includes(
        body.status
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid prescription status",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       VALIDATE ADMIN NOTE
    ======================================================== */

    if (
      body.adminNote !==
        undefined &&
      body.adminNote.trim()
        .length > 1000
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Admin note cannot exceed 1000 characters",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       REQUIRE FIELD
    ======================================================== */

    if (
      body.status ===
        undefined &&
      body.adminNote ===
        undefined
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "At least one field is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       UPDATE STATUS
    ======================================================== */

    if (
      body.status !==
      undefined
    ) {
      prescription.status =
        body.status;

      /* ------------------------------------------------------
         REVIEW METADATA
      ------------------------------------------------------- */

      if (
        body.status ===
          "REVIEWING" ||
        body.status ===
          "APPROVED" ||
        body.status ===
          "REJECTED"
      ) {
        if (
          admin &&
          typeof admin.userId ===
            "string" &&
          mongoose.isValidObjectId(
            admin.userId
          )
        ) {
          prescription.reviewedBy =
            new mongoose.Types.ObjectId(
              admin.userId
            );
        }

        prescription.reviewedAt =
          new Date();
      }

      /* ------------------------------------------------------
         RESET REVIEW
      ------------------------------------------------------- */

      if (
        body.status ===
        "PENDING"
      ) {
        prescription.reviewedBy =
          null;

        prescription.reviewedAt =
          null;
      }
    }

    /* ========================================================
       ADMIN NOTE
    ======================================================== */

    if (
      body.adminNote !==
      undefined
    ) {
      prescription.adminNote =
        body.adminNote.trim();
    }

    /* ========================================================
       SAVE
    ======================================================== */

    const updatedPrescription =
      await prescription.save();

    /* ========================================================
       FETCH POPULATED RESULT
    ======================================================== */

    const populatedPrescription =
      await getPopulatedPrescription(
        updatedPrescription._id.toString()
      );

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data:
            populatedPrescription,

          message:
            "Prescription updated successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    return handleRouteError(
      request,
      error,
      "Failed to update prescription"
    );
  }
}

/* ============================================================
   DELETE PRESCRIPTION
   ADMIN ONLY
============================================================ */

export async function DELETE(
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
       ADMIN AUTH
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
       FIND PRESCRIPTION
    ======================================================== */

    const prescription =
      await Prescription.findById(
        id
      )
        .select(
          "_id patientName image status"
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
       DELETE CLOUDINARY FILE
       
       This is intentionally best-effort.
       
       If Cloudinary deletion fails, we still delete the
       database record so the admin isn't blocked by an
       external storage issue.
    ======================================================== */

    let cloudinaryDeleted =
      false;

    if (
      prescription.image
    ) {
      const cloudinaryResult =
        await deleteCloudinaryFile(
          prescription.image
        );

      cloudinaryDeleted =
        cloudinaryResult.deleted;
    }

    /* ========================================================
       DELETE DATABASE RECORD
    ======================================================== */

    await Prescription.deleteOne(
      {
        _id:
          prescription._id,
      }
    );

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data: {
            _id:
              prescription._id.toString(),

            patientName:
              prescription.patientName,

            cloudinaryDeleted:
              cloudinaryDeleted,
          },

          message:
            "Prescription deleted successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    return handleRouteError(
      request,
      error,
      "Failed to delete prescription"
    );
  }
}

/* ============================================================
   COMMON ERROR HANDLER
============================================================ */

function handleRouteError(
  request: NextRequest,
  error: unknown,
  fallbackMessage: string
) {
  if (
    error instanceof
    Error
  ) {
    /* ========================================================
       UNAUTHORIZED
    ======================================================== */

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

    /* ========================================================
       FORBIDDEN
    ======================================================== */

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

    /* ========================================================
       SERVER CONFIG
    ======================================================== */

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

    /* ========================================================
       GEMINI API KEY
    ======================================================== */

    if (
      error.message.includes(
        "GEMINI_API_KEY"
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Gemini API is not configured correctly",
          },
          {
            status: 500,
          }
        )
      );
    }

    /* ========================================================
       DEFAULT ERROR
    ======================================================== */

    console.error(
      "Prescription Route Error:",
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

  /* ==========================================================
     UNKNOWN ERROR
  =========================================================== */

  console.error(
    "Prescription Route Unknown Error:",
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