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
   CORS / ORIGINS
============================================================ */

const CLIENT_ORIGIN = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3001"
).replace(
  /\/+$/,
  ""
);

const ADMIN_ORIGIN = (
  process.env.ADMIN_ORIGIN ||
  "http://localhost:3000"
).replace(
  /\/+$/,
  ""
);

const ALLOWED_ORIGINS =
  new Set<string>([
    CLIENT_ORIGIN,
    ADMIN_ORIGIN,
  ]);

/* ============================================================
   CORS HELPERS
============================================================ */

function getAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return null;
  }

  const normalizedOrigin =
    origin.replace(
      /\/+$/,
      ""
    );

  if (
    ALLOWED_ORIGINS.has(
      normalizedOrigin
    )
  ) {
    return normalizedOrigin;
  }

  return null;
}

function isAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return true;
  }

  return (
    getAllowedOrigin(
      request
    ) !== null
  );
}

function applyCors(
  request: NextRequest,
  response: NextResponse
) {
  const origin =
    getAllowedOrigin(
      request
    );

  if (origin) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      origin
    );

    response.headers.set(
      "Access-Control-Allow-Credentials",
      "true"
    );

    response.headers.set(
      "Vary",
      "Origin"
    );
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  response.headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  return response;
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  if (
    !isAllowedOrigin(
      request
    )
  ) {
    return new NextResponse(
      null,
      {
        status: 403,
      }
    );
  }

  return applyCors(
    request,
    new NextResponse(
      null,
      {
        status: 204,
      }
    )
  );
}

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
   GET ORDERS

   ADMIN:
   - all orders
   - search
   - status filter
   - payment filter
   - pagination

   CUSTOMER:
   - only own orders
   - pagination
   - optional status/payment filters
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ORIGIN
    ======================================================== */

    if (
      !isAllowedOrigin(
        request
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid client origin",
          },
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       QUERY PARAMS
    ======================================================== */

    const searchParams =
      request.nextUrl
        .searchParams;

    const pageParam =
      searchParams.get(
        "page"
      );

    const limitParam =
      searchParams.get(
        "limit"
      );

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
      Number(
        pageParam
      );

    const requestedLimit =
      Number(
        limitParam
      );

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
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid order status filter",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      paymentStatus !==
        "ALL" &&
      !VALID_PAYMENT_STATUSES.has(
        paymentStatus as PaymentStatus
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid payment status filter",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       DETERMINE USER TYPE
       
       Try Admin first.
       If not Admin, try Customer.
    ======================================================== */

    let isAdmin =
      false;

    let customer:
      | Awaited<
          ReturnType<
            typeof requireCustomer
          >
        >
      | null = null;

    try {
      requireAdmin(
        request
      );

      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    /* ========================================================
       CUSTOMER AUTH
       
       Only needed when request is not Admin.
    ======================================================== */

    if (!isAdmin) {
      try {
        customer =
          await requireCustomer(
            request
          );
      } catch (
        customerError
      ) {
        if (
          customerError instanceof
            Error &&
          customerError.message ===
            "SERVER_CONFIG_ERROR"
        ) {
          return applyCors(
            request,
            NextResponse.json(
              {
                success: false,
                data: null,
                message:
                  "Server configuration error",
              },
              {
                status: 500,
              }
            )
          );
        }

        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Unauthorized",
            },
            {
              status: 401,
            }
          )
        );
      }
    }

    /* ========================================================
       BASE FILTER
    ======================================================== */

    const filter: Record<
      string,
      unknown
    > = {};

    /* ========================================================
       CUSTOMER FILTER
       
       Customer can ONLY query their own orders.
    ======================================================== */

    if (
      !isAdmin &&
      customer
    ) {
      filter.user =
        customer.id;
    }

    /* ========================================================
       STATUS FILTER
    ======================================================== */

    if (
      status !== "ALL"
    ) {
      filter.status =
        status;
    }

    /* ========================================================
       PAYMENT STATUS FILTER
    ======================================================== */

    if (
      paymentStatus !==
      "ALL"
    ) {
      filter.paymentStatus =
        paymentStatus;
    }

    /* ========================================================
       ADMIN SEARCH
       
       Search is intentionally available only for Admin.
    ======================================================== */

    if (
      isAdmin &&
      search
    ) {
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
        mongoose.isValidObjectId(
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

    /* ========================================================
       QUERY ORDERS
    ======================================================== */

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .populate({
            path: "user",
            select:
              "name email role isActive",
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

    /* ========================================================
       TOTAL PAGES
    ======================================================== */

    const totalPages =
      totalOrders === 0
        ? 0
        : Math.ceil(
            totalOrders /
              limit
          );

    /* ========================================================
       SERIALIZE CUSTOMER ORDERS
       
       Keeps customer response small and safe.
    ======================================================== */

    if (
      !isAdmin &&
      customer
    ) {
      const serializedOrders =
        orders.map(
          (order) => ({
            _id:
              order._id.toString(),

            totalAmount:
              Number(
                order.totalAmount ||
                  0
              ),

            status:
              order.status,

            paymentMethod:
              order.paymentMethod,

            paymentStatus:
              order.paymentStatus,

            shippingAddress:
              order.shippingAddress,

            items:
              order.items.map(
                (item) => ({
                  medicine:
                    item.medicine,

                  name:
                    item.name,

                  price:
                    Number(
                      item.price ||
                        0
                    ),

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ),

                  image:
                    item.image ||
                    "",
                })
              ),

            createdAt:
              order.createdAt
                ? order.createdAt.toISOString()
                : null,

            updatedAt:
              order.updatedAt
                ? order.updatedAt.toISOString()
                : null,
          })
        );

      return applyCors(
        request,
        NextResponse.json(
          {
            success: true,

            data: {
              customer: {
                id:
                  customer.id,

                name:
                  customer.name,

                email:
                  customer.email,
              },

              orders:
                serializedOrders,

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
                status,

                paymentStatus,
              },
            },

            message:
              "Customer orders fetched successfully",
          },
          {
            status: 200,
          }
        )
      );
    }

    /* ========================================================
       ADMIN RESPONSE
       
       Preserve the existing admin response shape.
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
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
      )
    );
  } catch (error) {
    console.error(
      "Get Orders Error:",
      error
    );

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to fetch orders",
        },
        {
          status: 500,
        }
      )
    );
  }
}

/* ============================================================
   POST - CUSTOMER CREATE ORDER

   This remains the existing customer order creation flow.
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       ORIGIN
    ======================================================== */

    if (
      !isAllowedOrigin(
        request
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid client origin",
          },
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       CUSTOMER AUTH
    ======================================================== */

    const customer =
      await requireCustomer(
        request
      );

    /* ========================================================
       BODY
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
       BASIC VALIDATION
    ======================================================== */

    if (
      items.length === 0
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Cart cannot be empty",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      items.length >
      100
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Too many items in order",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      !shippingAddress
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Shipping address is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      !paymentMethod ||
      !VALID_PAYMENT_METHODS.has(
        paymentMethod
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid payment method",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       SHIPPING
    ======================================================== */

    const name =
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

    if (!name) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Shipping name is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (
      name.length < 2
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Shipping name must be at least 2 characters long",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (!phone) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Phone number is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (!address) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Address is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (!city) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "City is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       VALIDATE ITEMS
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

    for (
      const item of requestedItems
    ) {
      if (
        !mongoose.isValidObjectId(
          item.medicineId
        )
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Invalid medicine ID",
            },
            {
              status: 400,
            }
          )
        );
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <= 0
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Medicine quantity must be a positive whole number",
            },
            {
              status: 400,
            }
          )
        );
      }

      if (
        item.quantity > 100
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Maximum quantity per medicine is 100",
            },
            {
              status: 400,
            }
          )
        );
      }
    }

    /* ========================================================
       COMBINE DUPLICATE ITEMS
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
       FETCH REAL MEDICINES
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

    if (
      medicines.length !==
      medicineIds.length
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "One or more medicines are unavailable",
          },
          {
            status: 409,
          }
        )
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
       BUILD ORDER ITEMS
    ======================================================== */

    const orderItems = [];

    let totalAmount =
      0;

    for (
      const medicineId of medicineIds
    ) {
      const medicine =
        medicineMap.get(
          medicineId
        );

      if (!medicine) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Medicine not found",
            },
            {
              status: 409,
            }
          )
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
        stock < quantity
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message: `${medicine.name} has only ${stock} item(s) available`,
            },
            {
              status: 409,
            }
          )
        );
      }

      const price =
        Number(
          medicine.price || 0
        );

      totalAmount +=
        price *
        quantity;

      orderItems.push({
        medicine:
          medicine._id,

        name:
          medicine.name,

        price,

        quantity,

        image:
          medicine.image ||
          "",
      });
    }

    totalAmount =
      Number(
        totalAmount.toFixed(
          2
        )
      );

    /* ========================================================
       PROTOTYPE PAYMENT
    ======================================================== */

    const paymentStatus: PaymentStatus =
      paymentMethod ===
      "ONLINE"
        ? "PAID"
        : "PENDING";

    /* ========================================================
       CREATE ORDER
    ======================================================== */

    const order =
      await Order.create({
        user:
          customer.id,

        items:
          orderItems,

        totalAmount,

        shippingAddress: {
          name,

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
       REDUCE STOCK
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
          await Order.findByIdAndDelete(
            order._id
          );

          return applyCors(
            request,
            NextResponse.json(
              {
                success: false,
                data: null,
                message:
                  "Stock changed while placing the order. Please try again.",
              },
              {
                status: 409,
              }
            )
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

      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Unable to reserve medicine stock",
          },
          {
            status: 500,
          }
        )
      );
    }

    /* ========================================================
       POPULATE CREATED ORDER
    ======================================================== */

    const populatedOrder =
      await Order.findById(
        order._id
      )
        .populate({
          path: "user",
          select:
            "name email role isActive",
        })
        .populate({
          path:
            "items.medicine",
          select:
            "name image price",
        })
        .lean();

    /* ========================================================
       SUCCESS
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
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
      )
    );
  } catch (error) {
    console.error(
      "Orders POST Error:",
      error
    );

    if (
      error instanceof
      Error
    ) {
      if (
        error.message ===
        "UNAUTHORIZED"
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Unauthorized",
            },
            {
              status: 401,
            }
          )
        );
      }

      if (
        error.message ===
        "FORBIDDEN"
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Admin access required",
            },
            {
              status: 403,
            }
          )
        );
      }

      if (
        error.message ===
        "SERVER_CONFIG_ERROR"
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Server configuration error",
            },
            {
              status: 500,
            }
          )
        );
      }
    }

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to place order",
        },
        {
          status: 500,
        }
      )
    );
  }
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