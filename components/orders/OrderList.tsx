"use client";

import type { IOrder } from "@/lib/models/Order";

export type AdminOrder = {
  _id: string;
  user:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | null;
  items: {
    medicine:
      | {
          _id: string;
          name: string;
          image?: string;
          price?: number;
        }
      | string
      | null;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    area?: string;
    postalCode?: string;
  };
  status: IOrder["status"];
  paymentStatus: IOrder["paymentStatus"];
  createdAt: string;
  updatedAt: string;
};

type OrderListProps = {
  orders: AdminOrder[];
  loading: boolean;
  onView: (order: AdminOrder) => void;
};

export default function OrderList({
  orders,
  loading,
  onView,
}: OrderListProps) {
  if (loading) {
    return <OrderListSkeleton />;
  }

  if (!orders.length) {
    return <OrderEmptyState />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Order
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Items
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Total
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Status
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Payment
              </th>

              <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <OrderTableRow
                key={order._id}
                order={order}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="grid gap-3 p-3 md:hidden">
        {orders.map((order) => (
          <OrderMobileCard
            key={order._id}
            order={order}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}

function OrderTableRow({
  order,
  onView,
}: {
  order: AdminOrder;
  onView: (order: AdminOrder) => void;
}) {
  const totalQuantity = getTotalQuantity(order);

  return (
    <tr className="border-b border-slate-100 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[150px] truncate text-sm font-bold text-slate-900">
            #{getShortOrderId(order._id)}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
            {order.user?.name ||
              "Unknown customer"}
          </p>

          <p className="mt-1 max-w-[200px] truncate text-[11px] text-slate-400">
            {order.user?.email || "No email"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {totalQuantity}{" "}
          {totalQuantity === 1
            ? "item"
            : "items"}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          ৳{Number(order.totalAmount).toFixed(2)}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={order.status} />
      </td>

      <td className="px-5 py-4">
        <PaymentBadge
          status={order.paymentStatus}
        />
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onView(order)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function OrderMobileCard({
  order,
  onView,
}: {
  order: AdminOrder;
  onView: (order: AdminOrder) => void;
}) {
  const totalQuantity = getTotalQuantity(order);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            #{getShortOrderId(order._id)}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {totalQuantity}{" "}
          {totalQuantity === 1
            ? "item"
            : "items"}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Customer
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {order.user?.name ||
            "Unknown customer"}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {order.user?.email || "No email"}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
        <span className="text-xs font-medium text-slate-500">
          Total Amount
        </span>

        <span className="text-base font-bold text-slate-900">
          ৳{Number(order.totalAmount).toFixed(2)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={order.status} />

        <PaymentBadge
          status={order.paymentStatus}
        />
      </div>

      <button
        type="button"
        onClick={() => onView(order)}
        className="mt-4 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-[0.99]"
      >
        View Order Details
      </button>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminOrder["status"];
}) {
  const config: Record<
    AdminOrder["status"],
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },
    CONFIRMED: {
      label: "Confirmed",
      className:
        "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    PROCESSING: {
      label: "Processing",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },
    SHIPPED: {
      label: "Shipped",
      className:
        "bg-violet-50 text-violet-700 border-violet-100",
    },
    DELIVERED: {
      label: "Delivered",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    CANCELLED: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-700 border-red-100",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status: AdminOrder["paymentStatus"];
}) {
  const config: Record<
    AdminOrder["paymentStatus"],
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label: "Payment Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },
    PAID: {
      label: "Paid",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    FAILED: {
      label: "Failed",
      className:
        "bg-red-50 text-red-700 border-red-100",
    },
    REFUNDED: {
      label: "Refunded",
      className:
        "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function OrderListSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-3xl sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <OrderIcon />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
        No orders found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
        Orders placed by customers will appear here.
      </p>
    </div>
  );
}

function getShortOrderId(id: string) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id.slice(-8).toUpperCase()
    : id.toUpperCase();
}

function getTotalQuantity(
  order: AdminOrder
) {
  return order.items.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
  );
}

/*
 * IMPORTANT:
 * Fixed timezone prevents server/client hydration
 * differences caused by different local timezones.
 */
function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function OrderIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 12H16M8 15H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}