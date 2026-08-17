import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Medicine from "@/lib/models/Medicine";

const LOW_STOCK_LIMIT = 10;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    await connectToDB();

    const medicines = await Medicine.find({
      isActive: true,
      stock: {
        $lte: LOW_STOCK_LIMIT,
      },
    })
      .populate({
        path: "category",
        select: "name slug",
      })
      .sort({
        stock: 1,
        name: 1,
      })
      .lean();

    const alerts = medicines.map((medicine) => ({
      _id: medicine._id.toString(),

      name: medicine.name,

      stock: Number(medicine.stock),

      price: Number(medicine.price),

      image: medicine.image || "",

      category:
        medicine.category &&
        typeof medicine.category === "object" &&
        "_id" in medicine.category
          ? {
              _id:
                medicine.category._id.toString(),

              name:
                "name" in medicine.category
                  ? String(
                      medicine.category.name || ""
                    )
                  : "",

              slug:
                "slug" in medicine.category
                  ? String(
                      medicine.category.slug || ""
                    )
                  : "",
            }
          : null,

      status:
        Number(medicine.stock) <= 0
          ? "OUT_OF_STOCK"
          : "LOW_STOCK",
    }));

    const outOfStockCount = alerts.filter(
      (item) => item.status === "OUT_OF_STOCK"
    ).length;

    const lowStockCount = alerts.filter(
      (item) => item.status === "LOW_STOCK"
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          alerts,
          summary: {
            totalAlerts: alerts.length,
            lowStock: lowStockCount,
            outOfStock: outOfStockCount,
          },
        },
        message: "Stock alerts fetched successfully",
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

    console.error(
      "Stock Alert API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to fetch stock alerts",
      },
      { status: 500 }
    );
  }
}