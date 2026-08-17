import mongoose from "mongoose";

import { connectToDB } from "@/lib/connectToDB";

import Order from "@/lib/models/Order";

import OrderPage from "@/components/orders/OrderPage";

import type { AdminOrder } from "@/components/orders/OrderList";

const INITIAL_LIMIT = 10;

type OrderPageLoaderProps = {
  initialSearch?: string;
  initialStatus?: string;
  initialPaymentStatus?: string;
  initialPage?: string;
  initialOrderId?: string;
};

const VALID_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const VALID_PAYMENT_STATUSES = new Set([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

/* ============================================================
   SERIALIZE ORDER
============================================================ */

function serializeOrder(
  order: any
): AdminOrder {
  return {
    _id: order._id.toString(),

    user:
      order.user &&
      typeof order.user === "object" &&
      "_id" in order.user
        ? {
            _id:
              order.user._id.toString(),

            name:
              "name" in order.user
                ? String(
                    order.user.name || ""
                  )
                : "",

            email:
              "email" in order.user
                ? String(
                    order.user.email || ""
                  )
                : "",
          }
        : null,

    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          medicine:
            item.medicine &&
            typeof item.medicine ===
              "object" &&
            "_id" in item.medicine
              ? {
                  _id:
                    item.medicine._id.toString(),

                  name:
                    "name" in item.medicine
                      ? String(
                          item.medicine
                            .name ||
                            item.name ||
                            ""
                        )
                      : item.name,

                  image:
                    "image" in item.medicine
                      ? String(
                          item.medicine
                            .image ||
                            item.image ||
                            ""
                        )
                      : item.image || "",

                  price:
                    "price" in item.medicine
                      ? Number(
                          item.medicine.price
                        )
                      : Number(
                          item.price || 0
                        ),
                }
              : typeof item.medicine ===
                "string"
              ? item.medicine
              : null,

          name: item.name,

          price: Number(
            item.price || 0
          ),

          quantity: Number(
            item.quantity || 0
          ),

          image:
            item.image || "",
        }))
      : [],

    totalAmount: Number(
      order.totalAmount || 0
    ),

    shippingAddress: {
      name:
        order.shippingAddress?.name ||
        "",

      phone:
        order.shippingAddress?.phone ||
        "",

      address:
        order.shippingAddress?.address ||
        "",

      city:
        order.shippingAddress?.city ||
        "",

      area:
        order.shippingAddress?.area ||
        "",

      postalCode:
        order.shippingAddress
          ?.postalCode || "",
    },

    status: order.status,

    paymentStatus:
      order.paymentStatus,

    createdAt:
      order.createdAt.toISOString(),

    updatedAt:
      order.updatedAt.toISOString(),
  };
}

export default async function OrderPageLoader({
  initialSearch,
  initialStatus,
  initialPaymentStatus,
  initialPage,
  initialOrderId,
}: OrderPageLoaderProps) {
  await connectToDB();

  const search =
    initialSearch?.trim() || "";

  const status =
    initialStatus &&
    VALID_STATUSES.has(initialStatus)
      ? initialStatus
      : "ALL";

  const paymentStatus =
    initialPaymentStatus &&
    VALID_PAYMENT_STATUSES.has(
      initialPaymentStatus
    )
      ? initialPaymentStatus
      : "ALL";

  const parsedPage =
    Number(initialPage);

  const page =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const filter: Record<
    string,
    unknown
  > = {};

  /* ==========================================================
     STATUS FILTER
  ========================================================== */

  if (status !== "ALL") {
    filter.status = status;
  }

  /* ==========================================================
     PAYMENT FILTER
  ========================================================== */

  if (paymentStatus !== "ALL") {
    filter.paymentStatus =
      paymentStatus;
  }

  /* ==========================================================
     SEARCH
  ========================================================== */

  if (search) {
    const User = (
      await import("@/lib/models/User")
    ).default;

    const escapeRegex = (
      value: string
    ) =>
      value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex = new RegExp(
      escapeRegex(search),
      "i"
    );

    const matchingUsers =
      await User.find({
        $or: [
          {
            name: regex,
          },
          {
            email: regex,
          },
        ],
      })
        .select("_id")
        .lean();

    const userIds =
      matchingUsers.map(
        (user) => user._id
      );

    const orConditions: Record<
      string,
      unknown
    >[] = [
      {
        "items.name": regex,
      },
    ];

    if (userIds.length > 0) {
      orConditions.push({
        user: {
          $in: userIds,
        },
      });
    }

    if (
      /^[a-f\d]{24}$/i.test(search)
    ) {
      orConditions.push({
        _id: search,
      });
    }

    filter.$or = orConditions;
  }

  /* ==========================================================
     PAGINATED ORDERS
  ========================================================== */

  const skip =
    (page - 1) * INITIAL_LIMIT;

  const [
    orders,
    totalOrders,
  ] = await Promise.all([
    Order.find(filter)
      .populate({
        path: "user",
        select: "name email",
      })
      .populate({
        path: "items.medicine",
        select: "name image price",
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(INITIAL_LIMIT)
      .lean(),

    Order.countDocuments(filter),
  ]);

  const serializedOrders: AdminOrder[] =
    orders.map(serializeOrder);

  /* ==========================================================
     EXACT ORDER
     
     Important:
     Even if the requested order is not
     on the current pagination page,
     load it separately.
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
          select: "name email",
        })
        .populate({
          path: "items.medicine",
          select: "name image price",
        })
        .lean();

    if (exactOrder) {
      initialSelectedOrder =
        serializeOrder(
          exactOrder
        );
    }
  }

  const totalPages =
    totalOrders === 0
      ? 0
      : Math.ceil(
          totalOrders /
            INITIAL_LIMIT
        );

  return (
    <OrderPage
      initialOrders={
        serializedOrders
      }

      initialPagination={{
        page,
        limit: INITIAL_LIMIT,
        totalOrders,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      }}

      initialSearch={search}

      initialStatus={status}

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