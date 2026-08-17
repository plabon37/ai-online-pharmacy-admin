import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Category from "@/lib/models/Category";

type CreateCategoryBody = {
  name?: string;
  description?: string;
  image?: string;
};

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET() {
  try {
    await connectToDB();

    const categories = await Category.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: categories,
        message: "Categories fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Categories Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    await connectToDB();

    const body = (await request.json()) as CreateCategoryBody;

    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const image = body.image?.trim() ?? "";

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Category name is required",
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
            "Category name must be at least 2 characters long",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Category name cannot exceed 100 characters",
        },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Description cannot exceed 500 characters",
        },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "A valid category name is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Check existing category
    // --------------------------------------------------

    const safeName = escapeRegex(name);

    const existingCategory = await Category.findOne({
      $or: [
        {
          name: {
            $regex: `^${safeName}$`,
            $options: "i",
          },
        },
        {
          slug,
        },
      ],
    });

    // --------------------------------------------------
    // ACTIVE duplicate
    // --------------------------------------------------

    if (
      existingCategory &&
      existingCategory.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `"${name}" already exists. Please use a different category name.`,
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // INACTIVE category exists
    // Restore it instead of creating duplicate
    // --------------------------------------------------

    if (
      existingCategory &&
      !existingCategory.isActive
    ) {
      existingCategory.name = name;
      existingCategory.slug = slug;
      existingCategory.description = description;
      existingCategory.image = image;
      existingCategory.isActive = true;

      const restoredCategory =
        await existingCategory.save();

      return NextResponse.json(
        {
          success: true,
          data: {
            _id: restoredCategory._id.toString(),
            name: restoredCategory.name,
            slug: restoredCategory.slug,
            description:
              restoredCategory.description ?? "",
            image: restoredCategory.image ?? "",
            isActive: restoredCategory.isActive,
            createdAt:
              restoredCategory.createdAt.toISOString(),
            updatedAt:
              restoredCategory.updatedAt.toISOString(),
          },
          message:
            "Previously deleted category restored successfully",
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------
    // Create new category
    // --------------------------------------------------

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image: category.image ?? "",
          isActive: category.isActive,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // --------------------------------------------------
    // Auth errors
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
    // Mongoose validation error
    // --------------------------------------------------

    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0];

      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            firstError?.message ||
            "Category validation failed",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Duplicate key error
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
            "Category with this name or slug already exists",
        },
        { status: 409 }
      );
    }

    console.error("Create Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}