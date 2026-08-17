import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/connectToDB";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import Order from "@/lib/models/Order";
import Medicine from "@/lib/models/Medicine";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    await connectToDB();

    const [
      orderSummary,
      medicineSummary,
      topMedicines,
      lowStockMedicines,
    ] = await Promise.all([
      /* ======================================================
         ORDER SUMMARY
      ====================================================== */

      Order.aggregate([
        {
          $facet: {
            totalOrders: [
              {
                $count: "count",
              },
            ],

            pendingOrders: [
              {
                $match: {
                  status: "PENDING",
                },
              },
              {
                $count: "count",
              },
            ],

            deliveredOrders: [
              {
                $match: {
                  status: "DELIVERED",
                },
              },
              {
                $count: "count",
              },
            ],

            cancelledOrders: [
              {
                $match: {
                  status: "CANCELLED",
                },
              },
              {
                $count: "count",
              },
            ],

            processingOrders: [
              {
                $match: {
                  status: {
                    $in: [
                      "CONFIRMED",
                      "PROCESSING",
                      "SHIPPED",
                    ],
                  },
                },
              },
              {
                $count: "count",
              },
            ],

            revenue: [
              {
                $match: {
                  status: {
                    $ne: "CANCELLED",
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: "$totalAmount",
                  },
                },
              },
            ],

            totalMedicinesSold: [
              {
                $match: {
                  status: {
                    $ne: "CANCELLED",
                  },
                },
              },
              {
                $unwind: "$items",
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: "$items.quantity",
                  },
                },
              },
            ],
          },
        },
      ]),

      /* ======================================================
         MEDICINE SUMMARY
      ====================================================== */

      Medicine.aggregate([
        {
          $facet: {
            totalMedicines: [
              {
                $match: {
                  isActive: true,
                },
              },
              {
                $count: "count",
              },
            ],

            lowStock: [
              {
                $match: {
                  isActive: true,
                  stock: {
                    $gt: 0,
                    $lte: 10,
                  },
                },
              },
              {
                $count: "count",
              },
            ],

            outOfStock: [
              {
                $match: {
                  isActive: true,
                  stock: {
                    $lte: 0,
                  },
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]),

      /* ======================================================
         TOP SELLING MEDICINES
      ====================================================== */

      Order.aggregate([
        {
          $match: {
            status: {
              $ne: "CANCELLED",
            },
          },
        },

        {
          $unwind: "$items",
        },

        {
          $group: {
            _id: "$items.medicine",
            name: {
              $first: "$items.name",
            },
            image: {
              $first: "$items.image",
            },
            quantitySold: {
              $sum: "$items.quantity",
            },
            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },

        {
          $sort: {
            quantitySold: -1,
          },
        },

        {
          $limit: 10,
        },
      ]),

      /* ======================================================
         LOW STOCK MEDICINES
      ====================================================== */

      Medicine.find({
        isActive: true,
        stock: {
          $lte: 10,
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
        .limit(10)
        .lean(),
    ]);

    /* ========================================================
       SAFE VALUES
    ======================================================== */

    const orderData = orderSummary[0] || {};

    const medicineData =
      medicineSummary[0] || {};

    const totalOrders =
      orderData.totalOrders?.[0]?.count || 0;

    const pendingOrders =
      orderData.pendingOrders?.[0]?.count || 0;

    const deliveredOrders =
      orderData.deliveredOrders?.[0]?.count || 0;

    const cancelledOrders =
      orderData.cancelledOrders?.[0]?.count || 0;

    const processingOrders =
      orderData.processingOrders?.[0]?.count || 0;

    const totalRevenue =
      orderData.revenue?.[0]?.total || 0;

    const totalMedicinesSold =
      orderData.totalMedicinesSold?.[0]?.total || 0;

    const totalMedicines =
      medicineData.totalMedicines?.[0]?.count || 0;

    const lowStockCount =
      medicineData.lowStock?.[0]?.count || 0;

    const outOfStockCount =
      medicineData.outOfStock?.[0]?.count || 0;

    /* ========================================================
       SERIALIZE LOW STOCK
    ======================================================== */

    const serializedLowStock =
      lowStockMedicines.map((medicine) => ({
        _id: medicine._id.toString(),

        name: medicine.name,

        stock: Number(medicine.stock),

        price: Number(medicine.price),

        image: medicine.image || "",

        category:
          medicine.category &&
          typeof medicine.category ===
            "object" &&
          "_id" in medicine.category
            ? {
                _id:
                  medicine.category._id.toString(),

                name:
                  "name" in medicine.category
                    ? String(
                        medicine.category
                          .name || ""
                      )
                    : "",

                slug:
                  "slug" in medicine.category
                    ? String(
                        medicine.category
                          .slug || ""
                      )
                    : "",
              }
            : null,
      }));

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,
        data: {
          orders: {
            total: totalOrders,
            pending: pendingOrders,
            processing: processingOrders,
            delivered: deliveredOrders,
            cancelled: cancelledOrders,
          },

          revenue: {
            total: Number(totalRevenue),
          },

          medicines: {
            total: totalMedicines,
            sold: Number(
              totalMedicinesSold
            ),
            lowStock: lowStockCount,
            outOfStock: outOfStockCount,
          },

          topSellingMedicines:
            topMedicines.map((medicine) => ({
              _id:
                medicine._id?.toString() || "",

              name:
                medicine.name || "Unknown Medicine",

              image:
                medicine.image || "",

              quantitySold:
                Number(
                  medicine.quantitySold || 0
                ),

              revenue:
                Number(
                  medicine.revenue || 0
                ),
            })),

          lowStockMedicines:
            serializedLowStock,
        },

        message:
          "Reports fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
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
          { status: 401 }
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
      "Reports API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to generate reports",
      },
      { status: 500 }
    );
  }
}