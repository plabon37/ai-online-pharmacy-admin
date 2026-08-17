import { NextRequest, NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Image file is required",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Only JPG, PNG and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Selected image is empty",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Image size must be 5MB or less",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const base64 = buffer.toString("base64");

    const dataUri = `data:${file.type};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(
      dataUri,
      {
        folder: "smart-pharmacy/categories",
        resource_type: "image",
        transformation: [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
        message: "Image uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

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

      return NextResponse.json(
        {
          success: false,
          data: null,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}