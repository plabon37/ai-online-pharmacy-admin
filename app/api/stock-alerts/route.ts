import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Medicine from "@/lib/models/Medicine";
import Category from "@/lib/models/Category";

export const dynamic =
  "force-dynamic";

const LOW_STOCK_LIMIT = 10;

/* ============================================================
   GET STOCK ALERTS
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    const admin = requireAdmin(
      request
    );

    if (!admin?.userId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       CONNECT DATABASE
    ======================================================== */

    await connectToDB();

    /*
     * IMPORTANT:
     * Category is intentionally imported above.
     *
     * Medicine.category references the Category model.
     * Importing Category here guarantees that Mongoose
     * has registered the model before populate() runs.
     */

    /* ========================================================
       FIND STOCK ALERTS
    ======================================================== */

    const medicines =
      await Medicine.find({
        isActive: true,

        stock: {
          $lte: LOW_STOCK_LIMIT,
        },
      })
        .populate({
          path: "category",
          model: Category,
          select:
            "_id name slug",
        })
        .select(
          "_id name genericName category stock price image isActive"
        )
        .sort({
          stock: 1,
          name: 1,
        })
        .lean();

    /* ========================================================
       SERIALIZE
    ======================================================== */

    const alerts =
      medicines.map(
        (medicine) => ({
          _id:
            medicine._id.toString(),

          name:
            medicine.name || "",

          genericName:
            medicine.genericName || "",

          stock: Number(
            medicine.stock || 0
          ),

          price: Number(
            medicine.price || 0
          ),

          image:
            medicine.image || "",

          category:
            medicine.category &&
            typeof medicine.category ===
              "object" &&
            "_id" in
              medicine.category
              ? {
                  _id:
                    medicine.category._id.toString(),

                  name:
                    "name" in
                    medicine.category
                      ? String(
                          medicine.category
                            .name || ""
                        )
                      : "",

                  slug:
                    "slug" in
                    medicine.category
                      ? String(
                          medicine.category
                            .slug || ""
                        )
                      : "",
                }
              : null,

          alertType:
            Number(
              medicine.stock || 0
            ) <= 0
              ? "OUT_OF_STOCK"
              : "LOW_STOCK",
        })
      );

    /* ========================================================
       SUMMARY
    ======================================================== */

    const outOfStock =
      alerts.filter(
        (medicine) =>
          medicine.alertType ===
          "OUT_OF_STOCK"
      ).length;

    const lowStock =
      alerts.filter(
        (medicine) =>
          medicine.alertType ===
          "LOW_STOCK"
      ).length;

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        data: {
          alerts,

          summary: {
            total: alerts.length,
            outOfStock,
            lowStock,
            lowStockLimit:
              LOW_STOCK_LIMIT,
          },
        },

        message:
          "Stock alerts fetched successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Stock Alert API Error:",
      error
    );

    /* ========================================================
       AUTH ERRORS
    ======================================================== */

    if (error instanceof Error) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      if (
        error.message ===
        "FORBIDDEN"
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Admin access required",
          },
          {
            status: 403,
          }
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
          {
            status: 500,
          }
        );
      }

      /* ======================================================
         MISSING CATEGORY MODEL
      ====================================================== */

      if (
        error.name ===
          "MissingSchemaError" &&
        error.message.includes(
          'model "Category"'
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Category model is not registered correctly",
          },
          {
            status: 500,
          }
        );
      }
    }

    /* ========================================================
       GENERAL ERROR
    ======================================================== */

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to fetch stock alerts",
      },
      {
        status: 500,
      }
    );
  }
}