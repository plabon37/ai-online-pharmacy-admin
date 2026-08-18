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
} from "@/lib/models/Order";

import Medicine from "@/lib/models/Medicine";

/* ============================================================
   ROUTE CONTEXT
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   UPDATE BODY
============================================================ */

type UpdateOrderBody = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

/* ============================================================
   STATUS VALUES
============================================================ */

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

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
    "GET, PUT, OPTIONS"
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
   GET SINGLE ORDER

   ADMIN:
   Any order.

   CUSTOMER:
   Only own order.
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
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
       ORDER ID
    ======================================================== */

    const { id } =
      await context.params;

    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid order ID",
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
       ADMIN CHECK
    ======================================================== */

    let isAdmin =
      false;

    try {
      requireAdmin(
        request
      );

      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    /* ========================================================
       ADMIN GET
    ======================================================== */

    if (isAdmin) {
      const order =
        await Order.findById(
          id
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
              "name image price stock isActive",
          })
          .lean();

      if (!order) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Order not found",
            },
            {
              status: 404,
            }
          )
        );
      }

      return applyCors(
        request,
        NextResponse.json(
          {
            success: true,
            data: order,
            message:
              "Order fetched successfully",
          },
          {
            status: 200,
          }
        )
      );
    }

    /* ========================================================
       CUSTOMER AUTH
    ======================================================== */

    let customer;

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

    /* ========================================================
       CUSTOMER OWN ORDER
    ======================================================== */

    const order =
      await Order.findOne({
        _id: id,
        user:
          customer.id,
      })
        .populate({
          path:
            "items.medicine",
          select:
            "name image price",
        })
        .lean();

    if (!order) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Order not found",
          },
          {
            status: 404,
          }
        )
      );
    }

    const customerOrder = {
      _id:
        order._id.toString(),

      user:
        customer.id,

      items:
        order.items.map(
          (item) => ({
            medicine:
              item.medicine,

            name:
              item.name,

            price:
              Number(
                item.price || 0
              ),

            quantity:
              Number(
                item.quantity ||
                  0
              ),

            image:
              item.image || "",
          })
        ),

      totalAmount:
        Number(
          order.totalAmount ||
            0
        ),

      shippingAddress:
        order.shippingAddress,

      status:
        order.status,

      paymentMethod:
        order.paymentMethod,

      paymentStatus:
        order.paymentStatus,

      createdAt:
        order.createdAt,

      updatedAt:
        order.updatedAt,
    };

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,
          data: customerOrder,
          message:
            "Order fetched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Get Single Order Error:",
      error
    );

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to fetch order",
        },
        {
          status: 500,
        }
      )
    );
  }
}

/* ============================================================
   PUT
   ADMIN ONLY

   Handles:
   1. Normal order status update
   2. Cancel order → restore stock
   3. Cancelled → active → reserve stock again
============================================================ */

export async function PUT(
  request: NextRequest,
  context: RouteContext
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
       ADMIN AUTH
    ======================================================== */

    try {
      requireAdmin(
        request
      );
    } catch (error) {
      if (
        error instanceof
          Error &&
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
        error instanceof
          Error &&
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

    /* ========================================================
       ORDER ID
    ======================================================== */

    const { id } =
      await context.params;

    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid order ID",
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
       BODY
    ======================================================== */

    let body:
      | UpdateOrderBody
      | null = null;

    try {
      body =
        (await request.json()) as UpdateOrderBody;
    } catch {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid request body",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       FIND ORDER
    ======================================================== */

    const order =
      await Order.findById(
        id
      );

    if (!order) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Order not found",
          },
          {
            status: 404,
          }
        )
      );
    }

    /* ========================================================
       VALIDATE ORDER STATUS
    ======================================================== */

    if (
      body.status !==
        undefined &&
      !ORDER_STATUSES.includes(
        body.status
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid order status",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       VALIDATE PAYMENT STATUS
    ======================================================== */

    if (
      body.paymentStatus !==
        undefined &&
      !PAYMENT_STATUSES.includes(
        body.paymentStatus
      )
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid payment status",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       REQUIRE AT LEAST ONE FIELD
    ======================================================== */

    if (
      body.status ===
        undefined &&
      body.paymentStatus ===
        undefined
    ) {
      return applyCors(
        request,
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "At least one order field is required",
          },
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       TRACK STATUS TRANSITION
    ======================================================== */

    const oldStatus =
      order.status;

    const newStatus =
      body.status ??
      oldStatus;

    const isCancelling =
      oldStatus !==
        "CANCELLED" &&
      newStatus ===
        "CANCELLED";

    const isReactivating =
      oldStatus ===
        "CANCELLED" &&
      newStatus !==
        "CANCELLED";

    /* ========================================================
       CANCEL ORDER
       
       Restore stock exactly once.
    ======================================================== */

    if (
      isCancelling
    ) {
      try {
        for (
          const item of
            order.items
        ) {
          await Medicine.findByIdAndUpdate(
            item.medicine,
            {
              $inc: {
                stock:
                  item.quantity,
              },
            }
          );
        }
      } catch (stockError) {
        console.error(
          "Cancel Order Stock Restore Error:",
          stockError
        );

        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,
              data: null,
              message:
                "Unable to restore medicine stock. Order was not cancelled.",
            },
            {
              status: 500,
            }
          )
        );
      }
    }

    /* ========================================================
       REACTIVATE CANCELLED ORDER
       
       Before changing status, make sure enough stock exists.
    ======================================================== */

    if (
      isReactivating
    ) {
      /* ------------------------------------------------------
         First check every medicine.
      ------------------------------------------------------- */

      const stockProblems: string[] =
        [];

      for (
        const item of
          order.items
      ) {
        const medicine =
          await Medicine.findById(
            item.medicine
          )
            .select(
              "_id name stock isActive"
            )
            .lean();

        if (
          !medicine
        ) {
          stockProblems.push(
            `${item.name} is no longer available`
          );

          continue;
        }

        if (
          !medicine.isActive
        ) {
          stockProblems.push(
            `${item.name} is inactive`
          );

          continue;
        }

        const currentStock =
          Number(
            medicine.stock ||
              0
          );

        if (
          currentStock <
          item.quantity
        ) {
          stockProblems.push(
            `${item.name}: only ${currentStock} available, ${item.quantity} required`
          );
        }
      }

      if (
        stockProblems.length >
        0
      ) {
        return applyCors(
          request,
          NextResponse.json(
            {
              success: false,

              data: null,

              message:
                "Order cannot be reactivated because stock is insufficient",

              errors:
                stockProblems,
            },
            {
              status: 409,
            }
          )
        );
      }

      /* ------------------------------------------------------
         Reserve stock.
      ------------------------------------------------------- */

      const updatedMedicines: string[] =
        [];

      try {
        for (
          const item of
            order.items
        ) {
          const updatedMedicine =
            await Medicine.findOneAndUpdate(
              {
                _id:
                  item.medicine,

                isActive:
                  true,

                stock: {
                  $gte:
                    item.quantity,
                },
              },

              {
                $inc: {
                  stock:
                    -item.quantity,
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
             * Roll back medicines that were already
             * successfully reserved during this operation.
             */
            for (
              const rollbackItem of
                order.items
            ) {
              if (
                updatedMedicines.includes(
                  rollbackItem.medicine.toString()
                )
              ) {
                await Medicine.findByIdAndUpdate(
                  rollbackItem.medicine,
                  {
                    $inc: {
                      stock:
                        rollbackItem.quantity,
                    },
                  }
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
                    "Stock changed while reactivating the order. Please try again.",
                },
                {
                  status: 409,
                }
              )
            );
          }

          updatedMedicines.push(
            item.medicine.toString()
          );
        }
      } catch (stockError) {
        console.error(
          "Reactivate Order Stock Error:",
          stockError
        );

        /*
         * Rollback all medicines reserved so far.
         */
        for (
          const rollbackItem of
            order.items
        ) {
          if (
            updatedMedicines.includes(
              rollbackItem.medicine.toString()
            )
          ) {
            await Medicine.findByIdAndUpdate(
              rollbackItem.medicine,
              {
                $inc: {
                  stock:
                    rollbackItem.quantity,
                },
              }
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
                "Unable to reserve medicine stock",
            },
            {
              status: 500,
            }
          )
        );
      }
    }

    /* ========================================================
       UPDATE ORDER STATUS
    ======================================================== */

    if (
      body.status !==
      undefined
    ) {
      order.status =
        body.status;
    }

    /* ========================================================
       UPDATE PAYMENT STATUS
    ======================================================== */

    if (
      body.paymentStatus !==
      undefined
    ) {
      order.paymentStatus =
        body.paymentStatus;
    }

    /* ========================================================
       SAVE ORDER
    ======================================================== */

    const updatedOrder =
      await order.save();

    /* ========================================================
       POPULATE UPDATED ORDER
    ======================================================== */

    const populatedOrder =
      await Order.findById(
        updatedOrder._id
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
            "name image price stock isActive",
        })
        .lean();

    /* ========================================================
       RESPONSE MESSAGE
    ======================================================== */

    let message =
      "Order updated successfully";

    if (
      isCancelling
    ) {
      message =
        "Order cancelled and medicine stock restored successfully";
    }

    if (
      isReactivating
    ) {
      message =
        "Order reactivated and medicine stock reserved successfully";
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return applyCors(
      request,
      NextResponse.json(
        {
          success: true,

          data:
            populatedOrder,

          message,
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Update Order Error:",
      error
    );

    return applyCors(
      request,
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to update order",
        },
        {
          status: 500,
        }
      )
    );
  }
}