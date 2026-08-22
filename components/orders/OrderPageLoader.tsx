import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";

import Order from "@/lib/models/Order";

import OrderPage from "@/components/orders/OrderPage";

import type { AdminOrder } from "@/components/orders/OrderList";

/* ============================================================
   FORCE DYNAMIC
============================================================ */

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

/* ============================================================
   CONFIG
============================================================ */

const INITIAL_LIMIT = 10;

/* ============================================================
   TYPES
============================================================ */

type OrderPageLoaderProps = {
  initialSearch?: string;
  initialStatus?: string;
  initialPaymentStatus?: string;
  initialPage?: string;
  initialOrderId?: string;
};

/* ============================================================
   VALID STATUSES
============================================================ */

const VALID_STATUSES =
  new Set([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]);

/* ============================================================
   VALID PAYMENT STATUSES
============================================================ */

const VALID_PAYMENT_STATUSES =
  new Set([
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
  ]);

/* ============================================================
   SAFE STRING
============================================================ */

function safeString(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

/* ============================================================
   SAFE NUMBER
============================================================ */

function safeNumber(
  value: unknown
): number {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : 0;
}

/* ============================================================
   SAFE DATE
============================================================ */

function safeDate(
  value: unknown
): string {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          String(value)
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toISOString();
}

/* ============================================================
   ESCAPE REGEX
============================================================ */

function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* ============================================================
   SERIALIZE ORDER
============================================================ */

function serializeOrder(
  order: any
): AdminOrder {
  const serializedUser =
    order.user &&
    typeof order.user ===
      "object" &&
    order.user._id
      ? {
          _id:
            order.user._id.toString(),

          name:
            safeString(
              order.user.name
            ),

          email:
            safeString(
              order.user.email
            ),
        }
      : null;

  const serializedItems =
    Array.isArray(
      order.items
    )
      ? order.items.map(
          (item: any) => {
            let medicine:
              | {
                  _id: string;
                  name: string;
                  image: string;
                  price: number;
                }
              | string
              | null =
              null;

            /* ================================================
               POPULATED MEDICINE
            ================================================= */

            if (
              item.medicine &&
              typeof item.medicine ===
                "object" &&
              item.medicine._id
            ) {
              medicine = {
                _id:
                  item.medicine._id.toString(),

                name:
                  safeString(
                    item.medicine.name ||
                      item.name
                  ),

                image:
                  safeString(
                    item.medicine.image ||
                      item.image
                  ),

                price:
                  safeNumber(
                    item.medicine.price ??
                      item.price
                  ),
              };
            }

            /* ================================================
               MEDICINE ID ONLY
            ================================================= */

            else if (
              typeof item.medicine ===
              "string"
            ) {
              medicine =
                item.medicine;
            }

            return {
              medicine,

              name:
                safeString(
                  item.name
                ),

              price:
                safeNumber(
                  item.price
                ),

              quantity:
                safeNumber(
                  item.quantity
                ),

              image:
                safeString(
                  item.image
                ),
            };
          }
        )
      : [];

  return {
    _id:
      order._id.toString(),

    user:
      serializedUser,

    items:
      serializedItems,

    totalAmount:
      safeNumber(
        order.totalAmount
      ),

    shippingAddress: {
      name:
        safeString(
          order.shippingAddress?.name
        ),

      phone:
        safeString(
          order.shippingAddress?.phone
        ),

      address:
        safeString(
          order.shippingAddress?.address
        ),

      city:
        safeString(
          order.shippingAddress?.city
        ),

      area:
        safeString(
          order.shippingAddress?.area
        ),

      postalCode:
        safeString(
          order.shippingAddress?.postalCode
        ),
    },

    status:
      safeString(
        order.status
      ) as AdminOrder["status"],

    paymentStatus:
      safeString(
        order.paymentStatus
      ) as AdminOrder["paymentStatus"],

    createdAt:
      safeDate(
        order.createdAt
      ),

    updatedAt:
      safeDate(
        order.updatedAt
      ),
  };
}

/* ============================================================
   LOADER
============================================================ */

export default async function OrderPageLoader({
  initialSearch,
  initialStatus,
  initialPaymentStatus,
  initialPage,
  initialOrderId,
}: OrderPageLoaderProps) {
  /* ==========================================================
     DATABASE
  ========================================================== */

  await connectToDB();

  /* ==========================================================
     SEARCH
  ========================================================== */

  const search =
    safeString(
      initialSearch
    ).trim();

  /* ==========================================================
     ORDER STATUS
  ========================================================== */

  const status =
    initialStatus &&
    VALID_STATUSES.has(
      initialStatus
    )
      ? initialStatus
      : "ALL";

  /* ==========================================================
     PAYMENT STATUS
  ========================================================== */

  const paymentStatus =
    initialPaymentStatus &&
    VALID_PAYMENT_STATUSES.has(
      initialPaymentStatus
    )
      ? initialPaymentStatus
      : "ALL";

  /* ==========================================================
     PAGE
  ========================================================== */

  const parsedPage =
    Number(
      initialPage
    );

  const page =
    Number.isInteger(
      parsedPage
    ) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  /* ==========================================================
     FILTER
  ========================================================== */

  const filter: Record<
    string,
    unknown
  > = {};

  /* ==========================================================
     STATUS FILTER
  ========================================================== */

  if (
    status !== "ALL"
  ) {
    filter.status =
      status;
  }

  /* ==========================================================
     PAYMENT FILTER
  ========================================================== */

  if (
    paymentStatus !==
    "ALL"
  ) {
    filter.paymentStatus =
      paymentStatus;
  }

  /* ==========================================================
     SEARCH FILTER
  ========================================================== */

  if (search) {
    const User =
      (
        await import(
          "@/lib/models/User"
        )
      ).default;

    const regex =
      new RegExp(
        escapeRegex(
          search
        ),
        "i"
      );

    /* ========================================================
       MATCH CUSTOMERS
    ======================================================== */

    const matchingUsers =
      await User.find({
        $or: [
          {
            name: {
              $regex:
                escapeRegex(
                  search
                ),

              $options:
                "i",
            },
          },

          {
            email: {
              $regex:
                escapeRegex(
                  search
                ),

              $options:
                "i",
            },
          },
        ],
      })
        .select("_id")
        .lean();

    /* ========================================================
       USER IDS
    ======================================================== */

    const userIds =
      matchingUsers.map(
        (user) =>
          user._id
      );

    /* ========================================================
       SEARCH CONDITIONS
    ======================================================== */

    const orConditions: Record<
      string,
      unknown
    >[] = [
      {
        "items.name":
          regex,
      },
    ];

    if (
      userIds.length > 0
    ) {
      orConditions.push({
        user: {
          $in: userIds,
        },
      });
    }

    /* ========================================================
       ORDER ID SEARCH
    ======================================================== */

    if (
      mongoose.isValidObjectId(
        search
      )
    ) {
      orConditions.push({
        _id:
          search,
      });
    }

    filter.$or =
      orConditions;
  }

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const skip =
    (page - 1) *
    INITIAL_LIMIT;

  /* ==========================================================
     FETCH ORDERS
  ========================================================== */

  const [
    orders,
    totalOrders,
  ] =
    await Promise.all([
      Order.find(
        filter
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

        .sort({
          createdAt:
            -1,
        })

        .skip(skip)

        .limit(
          INITIAL_LIMIT
        )

        .lean(),

      Order.countDocuments(
        filter
      ),
    ]);

  /* ==========================================================
     SERIALIZE ORDERS
  ========================================================== */

  const serializedOrders: AdminOrder[] =
    orders.map(
      (
        order
      ) =>
        serializeOrder(
          order
        )
    );

  /* ==========================================================
     EXACT ORDER
     
     Useful when opening:
     /dashboard/orders?order=ORDER_ID
  ========================================================== */

  let initialSelectedOrder:
    | AdminOrder
    | null = null;

  if (
    initialOrderId &&
    mongoose.isValidObjectId(
      initialOrderId
    )
  ) {
    const exactOrder =
      await Order.findById(
        initialOrderId
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

    if (exactOrder) {
      initialSelectedOrder =
        serializeOrder(
          exactOrder
        );
    }
  }

  /* ==========================================================
     TOTAL PAGES
  ========================================================== */

  const totalPages =
    totalOrders === 0
      ? 0
      : Math.ceil(
          totalOrders /
            INITIAL_LIMIT
        );

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <OrderPage
      initialOrders={
        serializedOrders
      }

      initialPagination={{
        page,

        limit:
          INITIAL_LIMIT,

        totalOrders,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page >
          1,
      }}

      initialSearch={
        search
      }

      initialStatus={
        status
      }

      initialPaymentStatus={
        paymentStatus
      }

      initialOrderId={
        initialOrderId
      }

      initialSelectedOrder={
        initialSelectedOrder
      }
    />
  );
}