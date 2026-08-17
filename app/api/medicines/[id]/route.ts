import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Medicine from "@/lib/models/Medicine";
import Category from "@/lib/models/Category";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

type UpdateMedicineBody = {
  name?: string;
  genericName?: string;
  category?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  image?: string;
  isActive?: boolean;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toNumber(
  value: number | string | undefined
): number | null {
  if (value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ============================================================
   GET SINGLE MEDICINE
============================================================ */

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const medicine = await Medicine.findOne({
      _id: id,
      isActive: true,
    })
      .populate({
        path: "category",
        select: "name slug image isActive",
      })
      .lean();

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: medicine,
        message: "Medicine fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Single Medicine Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch medicine",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE MEDICINE
============================================================ */

export async function PUT(
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
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const body =
      (await request.json()) as UpdateMedicineBody;

    const existingMedicine =
      await Medicine.findById(id);

    if (!existingMedicine) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    /* --------------------------------------------------------
       Store old image before changing anything
    --------------------------------------------------------- */

    const oldImage = existingMedicine.image || "";

    /* --------------------------------------------------------
       Basic fields
    --------------------------------------------------------- */

    const name =
      body.name !== undefined
        ? body.name.trim()
        : existingMedicine.name;

    const genericName =
      body.genericName !== undefined
        ? body.genericName.trim()
        : existingMedicine.genericName || "";

    const description =
      body.description !== undefined
        ? body.description.trim()
        : existingMedicine.description || "";

    const image =
      body.image !== undefined
        ? body.image.trim()
        : existingMedicine.image || "";

    const category =
      body.category !== undefined
        ? body.category.trim()
        : existingMedicine.category.toString();

    const price =
      body.price !== undefined
        ? toNumber(body.price)
        : Number(existingMedicine.price);

    const stock =
      body.stock !== undefined
        ? toNumber(body.stock)
        : Number(existingMedicine.stock);

    const isActive =
      body.isActive !== undefined
        ? body.isActive
        : existingMedicine.isActive;

    /* --------------------------------------------------------
       Validation
    --------------------------------------------------------- */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine name is required",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine name must be at least 2 characters long",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine name cannot exceed 150 characters",
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine category is required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(category)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Invalid medicine category",
        },
        { status: 400 }
      );
    }

    if (price === null || price < 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine price must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    if (
      stock === null ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine stock must be a non-negative whole number",
        },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Description cannot exceed 1000 characters",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Check category
    --------------------------------------------------------- */

    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Selected category does not exist or is inactive",
        },
        { status: 404 }
      );
    }

    /* --------------------------------------------------------
       Duplicate medicine check
       Same name + same category
    --------------------------------------------------------- */

    const safeName = escapeRegex(name);

    const duplicateMedicine =
      await Medicine.findOne({
        _id: { $ne: id },
        name: {
          $regex: `^${safeName}$`,
          $options: "i",
        },
        category,
        isActive: true,
      });

    if (duplicateMedicine) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "This medicine already exists in the selected category",
        },
        { status: 409 }
      );
    }

    /* --------------------------------------------------------
       Update MongoDB document
    --------------------------------------------------------- */

    existingMedicine.name = name;
    existingMedicine.genericName = genericName;

    existingMedicine.category =
      new mongoose.Types.ObjectId(category);

    existingMedicine.description = description;
    existingMedicine.price = price;
    existingMedicine.stock = stock;
    existingMedicine.image = image;
    existingMedicine.isActive = isActive;

    const updatedMedicine =
      await existingMedicine.save();

    /* --------------------------------------------------------
       Populate updated response
    --------------------------------------------------------- */

    const populatedMedicine =
      await Medicine.findById(updatedMedicine._id)
        .populate({
          path: "category",
          select: "name slug image isActive",
        })
        .lean();

    /* --------------------------------------------------------
       Delete OLD Cloudinary image
       
       Only after MongoDB update succeeds.
       
       We never delete the old image when:
       - no new image was provided
       - new image is same as old image
       - old image is not a Cloudinary image
    --------------------------------------------------------- */

    const imageChanged =
      Boolean(oldImage) &&
      Boolean(image) &&
      oldImage !== image;

    if (imageChanged) {
      try {
        const deleted =
          await deleteCloudinaryImage(oldImage);

        if (!deleted) {
          console.warn(
            "Old Cloudinary image could not be deleted:",
            oldImage
          );
        }
      } catch (cloudinaryError) {
        console.error(
          "Old Cloudinary image cleanup failed:",
          cloudinaryError
        );

        /*
         * Do NOT fail the medicine update.
         *
         * MongoDB already contains the correct new image,
         * so the medicine update remains successful.
         */
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: populatedMedicine,
        message: "Medicine updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    /* --------------------------------------------------------
       Authentication errors
    --------------------------------------------------------- */

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

      if (error.message === "SERVER_CONFIG_ERROR") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Server configuration error",
          },
          { status: 500 }
        );
      }
    }

    /* --------------------------------------------------------
       Mongoose validation
    --------------------------------------------------------- */

    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      const firstError =
        Object.values(error.errors)[0];

      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            firstError?.message ||
            "Medicine validation failed",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Duplicate key
    --------------------------------------------------------- */

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine with this information already exists",
        },
        { status: 409 }
      );
    }

    console.error("Update Medicine Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to update medicine",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE MEDICINE
============================================================ */

export async function DELETE(
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
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const medicine =
      await Medicine.findById(id);

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    /*
     * Soft delete.
     *
     * We keep the medicine document because future
     * orders and prescriptions may need historical data.
     */
    medicine.isActive = false;

    const deletedMedicine =
      await medicine.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: deletedMedicine._id.toString(),
          name: deletedMedicine.name,
          isActive: deletedMedicine.isActive,
        },
        message: "Medicine deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    /* --------------------------------------------------------
       Authentication errors
    --------------------------------------------------------- */

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

      if (error.message === "SERVER_CONFIG_ERROR") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Server configuration error",
          },
          { status: 500 }
        );
      }
    }

    console.error("Delete Medicine Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to delete medicine",
      },
      { status: 500 }
    );
  }
}