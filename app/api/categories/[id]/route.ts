import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Category from "@/lib/models/Category";

type UpdateCategoryBody = {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/categories/:id
 * Public read access.
 */
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
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Category fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch category",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/:id
 * Admin only.
 */
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
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const body = (await request.json()) as UpdateCategoryBody;

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    const nextName =
      body.name !== undefined
        ? body.name.trim()
        : existingCategory.name;

    if (!nextName) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    const nextSlug = createSlug(nextName);

    const safeName = escapeRegex(nextName);

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      $or: [
        {
          name: {
            $regex: `^${safeName}$`,
            $options: "i",
          },
        },
        {
          slug: nextSlug,
        },
      ],
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Another category with this name already exists",
        },
        { status: 409 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: nextName,
        slug: nextSlug,
        ...(body.description !== undefined && {
          description: body.description.trim(),
        }),
        ...(body.image !== undefined && {
          image: body.image.trim(),
        }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive,
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Category updated successfully",
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

    console.error("Update Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to update category",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/:id
 * Admin only.
 *
 * We use soft delete by setting isActive=false.
 * This keeps historical references safe.
 */
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
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectToDB();

    const category = await Category.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Category deleted successfully",
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

    console.error("Delete Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}