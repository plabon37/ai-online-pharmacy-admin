import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Medicine from "@/lib/models/Medicine";
import Category from "@/lib/models/Category";

type CreateMedicineBody = {
  name?: string;
  genericName?: string;
  category?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  image?: string;
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

export async function GET() {
  try {
    await connectToDB();

    const medicines = await Medicine.find({
      isActive: true,
    })
      .populate({
        path: "category",
        select: "name slug image isActive",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: medicines,
        message: "Medicines fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Medicines Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch medicines",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const body =
      (await request.json()) as CreateMedicineBody;

    const name = body.name?.trim() ?? "";
    const genericName =
      body.genericName?.trim() ?? "";
    const category =
      body.category?.trim() ?? "";
    const description =
      body.description?.trim() ?? "";
    const image = body.image?.trim() ?? "";

    const price = toNumber(body.price);
    const stock = toNumber(body.stock);

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

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

    if (price === null) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Valid medicine price is required",
        },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine price cannot be negative",
        },
        { status: 400 }
      );
    }

    if (stock === null) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Valid medicine stock is required",
        },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Medicine stock cannot be negative",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Medicine stock must be a whole number",
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

    // --------------------------------------------------
    // Check category
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Duplicate medicine check
    // --------------------------------------------------

    const duplicateMedicine =
      await Medicine.findOne({
        name: {
          $regex: `^${name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
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

    // --------------------------------------------------
    // Create medicine
    // --------------------------------------------------

    const medicine = await Medicine.create({
      name,
      genericName,
      category,
      description,
      price,
      stock,
      image,
      isActive: true,
    });

    const populatedMedicine =
      await Medicine.findById(medicine._id)
        .populate({
          path: "category",
          select: "name slug image isActive",
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedMedicine,
        message: "Medicine created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // --------------------------------------------------
    // Authentication errors
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Mongoose validation
    // --------------------------------------------------

    if (error instanceof mongoose.Error.ValidationError) {
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

    // --------------------------------------------------
    // Duplicate key
    // --------------------------------------------------

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

    console.error("Create Medicine Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to create medicine",
      },
      { status: 500 }
    );
  }
}