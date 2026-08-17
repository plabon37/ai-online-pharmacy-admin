import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Prescription, {
  PrescriptionStatus,
} from "@/lib/models/Prescription";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdatePrescriptionBody = {
  status?: PrescriptionStatus;
  adminNote?: string;
};

const VALID_STATUSES: PrescriptionStatus[] = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
];

/* ============================================================
   GET SINGLE PRESCRIPTION
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    requireAdmin(request);

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid prescription ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const prescription =
      await Prescription.findById(id)
        .populate({
          path: "user",
          select: "name email",
        })
        .populate({
          path: "reviewedBy",
          select: "name email role",
        })
        .lean();

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Prescription not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: prescription,
        message:
          "Prescription fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Admin access required",
          },
          { status: 403 }
        );
      }

      if (
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
          { status: 500 }
        );
      }
    }

    console.error(
      "Get Single Prescription Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch prescription",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE PRESCRIPTION
============================================================ */

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = requireAdmin(request);

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid prescription ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const body =
      (await request.json()) as UpdatePrescriptionBody;

    const prescription =
      await Prescription.findById(id);

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Prescription not found",
        },
        { status: 404 }
      );
    }

    /* --------------------------------------------------------
       Validate status
    --------------------------------------------------------- */

    if (
      body.status !== undefined &&
      !VALID_STATUSES.includes(body.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid prescription status",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Validate admin note
    --------------------------------------------------------- */

    if (
      body.adminNote !== undefined &&
      body.adminNote.trim().length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Admin note cannot exceed 1000 characters",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Require at least one field
    --------------------------------------------------------- */

    if (
      body.status === undefined &&
      body.adminNote === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "At least one field is required",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Update status
    --------------------------------------------------------- */

    if (body.status !== undefined) {
      prescription.status = body.status;

      /*
       * When an admin starts or completes a review,
       * save who reviewed it and when.
       */
      if (
        body.status === "REVIEWING" ||
        body.status === "APPROVED" ||
        body.status === "REJECTED"
      ) {
        if (
          admin &&
          typeof admin.userId === "string" &&
          mongoose.isValidObjectId(admin.userId)
        ) {
          prescription.reviewedBy =
            new mongoose.Types.ObjectId(
              admin.userId
            );
        }

        prescription.reviewedAt = new Date();
      }

      /*
       * If moved back to PENDING, clear review metadata.
       */
      if (body.status === "PENDING") {
        prescription.reviewedBy = null;
        prescription.reviewedAt = null;
      }
    }

    /* --------------------------------------------------------
       Update admin note
    --------------------------------------------------------- */

    if (body.adminNote !== undefined) {
      prescription.adminNote =
        body.adminNote.trim();
    }

    const updatedPrescription =
      await prescription.save();

    /* --------------------------------------------------------
       Populate updated response
    --------------------------------------------------------- */

    const populatedPrescription =
      await Prescription.findById(
        updatedPrescription._id
      )
        .populate({
          path: "user",
          select: "name email",
        })
        .populate({
          path: "reviewedBy",
          select: "name email role",
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedPrescription,
        message:
          "Prescription updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Admin access required",
          },
          { status: 403 }
        );
      }

      if (
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
          { status: 500 }
        );
      }
    }

    console.error(
      "Update Prescription Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to update prescription",
      },
      { status: 500 }
    );
  }
}