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

import Order, {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/models/Order";

import Medicine from "@/lib/models/Medicine";

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_LIMIT = 10;

const MAX_LIMIT = 50;

const VALID_STATUSES =
  new Set<OrderStatus>([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]);

const VALID_PAYMENT_STATUSES =
  new Set<PaymentStatus>([
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
  ]);

const VALID_PAYMENT_METHODS =
  new Set<PaymentMethod>([
    "COD",
    "ONLINE",
  ]);

/* ============================================================
   CUSTOMER ORDER TYPES
============================================================ */

type CreateOrderItemBody = {
  medicineId?: string;

  quantity?: number;
};

type ShippingAddressBody = {
  name?: string;

  phone?: string;

  address?: string;

  city?: string;

  area?: string;

  postalCode?: string;
};

type CreateOrderBody = {
  items?: CreateOrderItemBody[];

  shippingAddress?: ShippingAddressBody;

  paymentMethod?: PaymentMethod;
};

/* ============================================================
   GET
   ADMIN ORDER LIST
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    requireAdmin(request);

    await connectToDB();

    const searchParams =
      request.nextUrl.searchParams;

    const pageParam =
      searchParams.get("page");

    const limitParam =
      searchParams.get("limit");

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "ALL";

    const paymentStatus =
      searchParams
        .get("paymentStatus")
        ?.trim() || "ALL";

    const requestedPage =
      Number(pageParam);

    const requestedLimit =
      Number(limitParam);

    const page =
      Number.isInteger(
        requestedPage
      ) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(
        requestedLimit
      ) &&
      requestedLimit > 0
        ? Math.min(
            requestedLimit,
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    /* ========================================================
       VALIDATE FILTERS
    ======================================================== */

    if (
      status !== "ALL" &&
      !VALID_STATUSES.has(
        status as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Invalid order status filter",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paymentStatus !== "ALL" &&
      !VALID_PAYMENT_STATUSES.has(
        paymentStatus as PaymentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Invalid payment status filter",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       FILTER
    ======================================================== */

    const filter: Record<
      string,
      unknown
    > = {};

    if (
      status !== "ALL"
    ) {
      filter.status =
        status;
    }

    if (
      paymentStatus !==
      "ALL"
    ) {
      filter.paymentStatus =
        paymentStatus;
    }

    /* ========================================================
       SEARCH
    ======================================================== */

    if (search) {
      const User =
        (
          await import(
            "@/lib/models/User"
          )
        ).default;

      const escapedSearch =
        escapeRegex(
          search
        );

      const matchingUsers =
        await User.find({
          $or: [
            {
              name: {
                $regex:
                  escapedSearch,
                $options:
                  "i",
              },
            },

            {
              email: {
                $regex:
                  escapedSearch,
                $options:
                  "i",
              },
            },
          ],
        })
          .select("_id")
          .lean();

      const userIds =
        matchingUsers.map(
          (user) =>
            user._id
        );

      const orConditions: Record<
        string,
        unknown
      >[] = [
        {
          items: {
            $elemMatch: {
              name: {
                $regex:
                  escapedSearch,

                $options:
                  "i",
              },
            },
          },
        },
      ];

      if (
        userIds.length >
        0
      ) {
        orConditions.push({
          user: {
            $in: userIds,
          },
        });
      }

      if (
        /^[a-f\d]{24}$/i.test(
          search
        )
      ) {
        orConditions.push({
          _id: search,
        });
      }

      filter.$or =
        orConditions;
    }

    /* ========================================================
       PAGINATION
    ======================================================== */

    const skip =
      (page - 1) *
      limit;

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .populate({
            path: "user",
            select:
              "name email",
          })
          .populate({
            path:
              "items.medicine",

            select:
              "name image price",
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(
          filter
        ),
      ]);

    const totalPages =
      totalOrders === 0
        ? 0
        : Math.ceil(
            totalOrders /
              limit
          );

    return NextResponse.json(
      {
        success: true,

        data: {
          orders,

          pagination: {
            page,

            limit,

            totalOrders,

            totalPages,

            hasNextPage:
              page <
              totalPages,

            hasPreviousPage:
              page > 1,
          },

          filters: {
            search,

            status,

            paymentStatus,
          },
        },

        message:
          "Orders fetched successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleAdminError(
      error,
      "Failed to fetch orders"
    );
  }
}

/* ============================================================
   POST
   CUSTOMER CREATE ORDER
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. REQUIRE CUSTOMER
    ======================================================== */

    const customer =
      await requireCustomer(
        request
      );

    /* ========================================================
       2. READ BODY
    ======================================================== */

    const body =
      (await request.json()) as CreateOrderBody;

    const items =
      Array.isArray(
        body.items
      )
        ? body.items
        : [];

    const shippingAddress =
      body.shippingAddress;

    const paymentMethod =
      body.paymentMethod;

    /* ========================================================
       3. BASIC VALIDATION
    ======================================================== */

    if (
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Cart cannot be empty",
        },
        {
          status: 400,
        }
      );
    }

    if (
      items.length >
      100
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Too many items in order",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !shippingAddress
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Shipping address is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !paymentMethod ||
      !VALID_PAYMENT_METHODS.has(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Invalid payment method",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       4. SHIPPING VALIDATION
    ======================================================== */

    const shippingName =
      shippingAddress.name?.trim() ||
      "";

    const phone =
      shippingAddress.phone?.trim() ||
      "";

    const address =
      shippingAddress.address?.trim() ||
      "";

    const city =
      shippingAddress.city?.trim() ||
      "";

    const area =
      shippingAddress.area?.trim() ||
      "";

    const postalCode =
      shippingAddress.postalCode?.trim() ||
      "";

    if (!shippingName) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Shipping name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Phone number is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Address is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "City is required",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       5. CONNECT DB
    ======================================================== */

    await connectToDB();

    /* ========================================================
       6. NORMALIZE MEDICINE IDS
    ======================================================== */

    const requestedItems =
      items.map(
        (item) => ({
          medicineId:
            item.medicineId
              ?.trim() || "",

          quantity:
            Number(
              item.quantity
            ),
        })
      );

    /* ========================================================
       7. VALIDATE QUANTITY + IDS
    ======================================================== */

    for (
      const item of requestedItems
    ) {
      if (
        !mongoose.isValidObjectId(
          item.medicineId
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Invalid medicine ID",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <=
          0
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Medicine quantity must be a positive whole number",
          },
          {
            status: 400,
          }
        );
      }

      if (
        item.quantity > 100
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Maximum quantity per medicine is 100",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ========================================================
       8. DUPLICATE MEDICINE IDS
       
       Combine them before price/stock validation.
    ======================================================== */

    const quantityMap =
      new Map<
        string,
        number
      >();

    for (
      const item of requestedItems
    ) {
      quantityMap.set(
        item.medicineId,

        (
          quantityMap.get(
            item.medicineId
          ) || 0
        ) +
          item.quantity
      );
    }

    /* ========================================================
       9. FETCH ACTUAL MEDICINES
    ======================================================== */

    const medicineIds =
      Array.from(
        quantityMap.keys()
      );

    const medicines =
      await Medicine.find({
        _id: {
          $in: medicineIds,
        },

        isActive: true,
      })
        .select(
          "_id name price stock image"
        )
        .lean();

    /* ========================================================
       10. ALL MEDICINES MUST EXIST
    ======================================================== */

    if (
      medicines.length !==
      medicineIds.length
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "One or more medicines are unavailable",
        },
        {
          status: 409,
        }
      );
    }

    const medicineMap =
      new Map(
        medicines.map(
          (medicine) => [
            medicine._id.toString(),
            medicine,
          ]
        )
      );

    /* ========================================================
       11. VALIDATE STOCK + BUILD ORDER ITEMS
    ======================================================== */

    const orderItems = [];

    let totalAmount = 0;

    for (
      const medicineId of medicineIds
    ) {
      const medicine =
        medicineMap.get(
          medicineId
        );

      if (!medicine) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Medicine not found",
          },
          {
            status: 409,
          }
        );
      }

      const quantity =
        quantityMap.get(
          medicineId
        ) || 0;

      const stock =
        Number(
          medicine.stock || 0
        );

      if (
        stock <
        quantity
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message: `${medicine.name} has only ${stock} item(s) available`,
          },
          {
            status: 409,
          }
        );
      }

      const price =
        Number(
          medicine.price || 0
        );

      const lineTotal =
        price *
        quantity;

      totalAmount +=
        lineTotal;

      orderItems.push({
        medicine:
          medicine._id,

        name:
          medicine.name,

        price,

        quantity,

        image:
          medicine.image || "",
      });
    }

    /* ========================================================
       12. ROUND TOTAL
    ======================================================== */

    totalAmount =
      Number(
        totalAmount.toFixed(
          2
        )
      );

    /* ========================================================
       13. PAYMENT STATUS
       
       Prototype:
       
       COD    → PENDING
       ONLINE → PAID
    ======================================================== */

    const paymentStatus: PaymentStatus =
      paymentMethod ===
      "ONLINE"
        ? "PAID"
        : "PENDING";

    /* ========================================================
       14. CREATE ORDER
    ======================================================== */

    const order =
      await Order.create({
        user:
          customer.id,

        items:
          orderItems,

        totalAmount,

        shippingAddress: {
          name:
            shippingName,

          phone,

          address,

          city,

          area,

          postalCode,
        },

        status:
          "PENDING",

        paymentMethod,

        paymentStatus,
      });

    /* ========================================================
       15. REDUCE STOCK
       
       We only reduce stock after the order
       itself has been created successfully.
    ======================================================== */

    try {
      for (
        const medicineId of medicineIds
      ) {
        const quantity =
          quantityMap.get(
            medicineId
          ) || 0;

        const updatedMedicine =
          await Medicine.findOneAndUpdate(
            {
              _id:
                medicineId,

              isActive:
                true,

              stock: {
                $gte:
                  quantity,
              },
            },
            {
              $inc: {
                stock:
                  -quantity,
              },
            },
            {
              new: true,
            }
          );

        if (
          !updatedMedicine
        ) {
          /*
           * Stock changed between validation
           * and update.
           *
           * Remove newly created order so we
           * do not keep an invalid order.
           */

          await Order.findByIdAndDelete(
            order._id
          );

          return NextResponse.json(
            {
              success: false,

              data: null,

              message:
                "Stock changed while placing the order. Please try again.",
            },
            {
              status: 409,
            }
          );
        }
      }
    } catch (stockError) {
      console.error(
        "Order Stock Update Error:",
        stockError
      );

      await Order.findByIdAndDelete(
        order._id
      );

      throw new Error(
        "ORDER_STOCK_UPDATE_FAILED"
      );
    }

    /* ========================================================
       16. POPULATE CREATED ORDER
    ======================================================== */

    const populatedOrder =
      await Order.findById(
        order._id
      )
        .populate({
          path: "user",

          select:
            "name email",
        })
        .populate({
          path:
            "items.medicine",

          select:
            "name image price",
        })
        .lean();

    /* ========================================================
       17. RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        data: {
          order:
            populatedOrder,

          payment: {
            method:
              paymentMethod,

            status:
              paymentStatus,

            isPrototype:
              true,
          },
        },

        message:
          paymentMethod ===
          "ONLINE"
            ? "Order placed successfully. Online payment is simulated for this prototype."
            : "Order placed successfully.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /* ========================================================
       CUSTOMER AUTH ERRORS
    ======================================================== */

    if (
      error instanceof
      Error
    ) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Unauthorized",
          },
          {
            status: 401,
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

      if (
        error.message ===
        "ORDER_STOCK_UPDATE_FAILED"
      ) {
        return NextResponse.json(
          {
            success: false,

            data: null,

            message:
              "Unable to reserve medicine stock",
          },
          {
            status: 500,
          }
        );
      }
    }

    console.error(
      "Create Customer Order Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        data: null,

        message:
          "Failed to place order",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   ADMIN ERROR HANDLER
============================================================ */

function handleAdminError(
  error: unknown,
  fallbackMessage: string
) {
  if (
    error instanceof
    Error
  ) {
    if (
      error.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,

          data: null,

          message:
            "Unauthorized",
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
  }

  console.error(
    "Order API Error:",
    error
  );

  return NextResponse.json(
    {
      success: false,

      data: null,

      message:
        fallbackMessage,
    },
    {
      status: 500,
    }
  );
}

/* ============================================================
   ESCAPE REGEX
============================================================ */

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}