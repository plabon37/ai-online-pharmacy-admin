"use client";

import {
  useState,
} from "react";

import { useRouter } from "next/navigation";

type CustomerData = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CustomerOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

type CustomerDetailsResponse = {
  success: boolean;

  data: {
    customer: CustomerData;

    summary: {
      totalOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalSpent: number;
    };

    orders: CustomerOrder[];
  } | null;

  message: string;
};

type CustomerDetailsPageProps = {
  customerId: string;
};

export default function CustomerDetailsPage({
  customerId,
}: CustomerDetailsPageProps) {
  const router = useRouter();

  const [data, setData] =
    useState<
      CustomerDetailsResponse["data"]
    >(null);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD CUSTOMER DETAILS
  ========================================================== */

  const loadCustomer = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/customers/${encodeURIComponent(
          customerId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        console.error(
          "Customer details returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Customer API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as CustomerDetailsResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load customer"
        );
      }

      if (!result.data) {
        throw new Error(
          "Customer data unavailable"
        );
      }

      setData(result.data);
      setLoaded(true);
    } catch (error) {
      console.error(
        "Customer details error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customer details"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  if (!loaded && !loading && !error) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/customers"
            )
          }
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeftIcon />
          Back to Customers
        </button>

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-center text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <CustomerIcon large />
            </div>

            <h1 className="mt-5 text-xl font-bold sm:text-2xl">
              Customer Details
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-emerald-50 sm:text-sm">
              Load this customers profile,
              statistics and complete order history.
            </p>

            <button
              type="button"
              onClick={loadCustomer}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              <EyeIcon />
              View Customer Details
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !data) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/customers"
            )
          }
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeftIcon />
          Back to Customers
        </button>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:rounded-3xl sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
            <AlertIcon />
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
            Unable to load customer
          </h2>

          <p className="mx-auto mt-2 max-w-lg break-words text-xs leading-5 text-red-600 sm:text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCustomer}
            className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading && !data) {
    return (
      <CustomerDetailsSkeleton />
    );
  }

  if (!data) {
    return null;
  }

  const {
    customer,
    summary,
    orders,
  } = data;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* ======================================================
          BACK
      ======================================================= */}

      <button
        type="button"
        onClick={() =>
          router.push(
            "/dashboard/customers"
          )
        }
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ArrowLeftIcon />
        Back to Customers
      </button>

      {/* ======================================================
          PROFILE HEADER
      ======================================================= */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <CustomerAvatar
              name={customer.name}
              large
            />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
                Customer Profile
              </p>

              <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl lg:text-3xl">
                {customer.name ||
                  "Unnamed customer"}
              </h1>

              <p className="mt-1 break-all text-xs text-emerald-50 sm:text-sm">
                {customer.email ||
                  "No email"}
              </p>
            </div>
          </div>

          <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
            {customer.role ||
              "USER"}
          </div>
        </div>
      </section>

      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Orders"
          value={summary.totalOrders}
          description="All customer orders"
          className="bg-cyan-50 text-cyan-700"
        />

        <SummaryCard
          label="Delivered"
          value={
            summary.deliveredOrders
          }
          description="Successfully delivered"
          className="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Cancelled"
          value={
            summary.cancelledOrders
          }
          description="Cancelled orders"
          className="bg-red-50 text-red-700"
        />

        <SummaryCard
          label="Total Spent"
          value={`৳${Number(
            summary.totalSpent
          ).toFixed(2)}`}
          description="Non-cancelled orders"
          className="bg-violet-50 text-violet-700"
        />
      </section>

      {/* ======================================================
          CUSTOMER INFORMATION + ORDER HISTORY
      ======================================================= */}

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Customer Information */}
        <section className="h-fit rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 xl:sticky xl:top-[104px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Customer Information
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Account Details
          </h2>

          <div className="mt-5 space-y-3">
            <InfoRow
              label="Name"
              value={
                customer.name ||
                "Not available"
              }
            />

            <InfoRow
              label="Email"
              value={
                customer.email ||
                "Not available"
              }
            />

            <InfoRow
              label="Role"
              value={
                customer.role ||
                "USER"
              }
            />

            <InfoRow
              label="Joined"
              value={formatDate(
                customer.createdAt
              )}
            />

            <InfoRow
              label="Customer ID"
              value={customer._id}
            />
          </div>
        </section>

        {/* Order History */}
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
                Customer Activity
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                Order History
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                Complete order activity for this
                customer.
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 sm:text-xs">
              {orders.length}{" "}
              {orders.length === 1
                ? "order"
                : "orders"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <OrderIcon />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No orders found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                This customer has not placed any orders yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {orders.map(
                (order) => (
                  <OrderHistoryCard
                    key={order._id}
                    order={order}
                    onView={() =>
                      router.push(
                        `/dashboard/orders?order=${encodeURIComponent(
                          order._id
                        )}`
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </section>

      {/* ======================================================
          REFRESH
      ======================================================= */}

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words text-xs leading-5 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCustomer}
            className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ORDER HISTORY CARD
============================================================ */

function OrderHistoryCard({
  order,
  onView,
}: {
  order: CustomerOrder;
  onView: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-emerald-100 hover:bg-white hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">
              #{getShortId(order._id)}
            </p>

            <OrderStatusBadge
              status={order.status}
            />

            <PaymentStatusBadge
              status={
                order.paymentStatus
              }
            />
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatDateTime(
              order.createdAt
            )}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Amount
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-900">
              ৳
              {Number(
                order.totalAmount
              ).toFixed(2)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Items
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-800">
              {order.itemCount}
            </p>
          </div>

          <button
            type="button"
            onClick={onView}
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            View
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   SUMMARY
============================================================ */

function SummaryCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: string | number;
  description: string;
  className: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl p-4 shadow-sm sm:p-5 ${className}`}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70 sm:text-xs">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 truncate text-[11px] opacity-70 sm:text-xs">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   CUSTOMER AVATAR
============================================================ */

function CustomerAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const initials = getInitials(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/15 font-bold text-white backdrop-blur-sm ${
        large
          ? "h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl"
          : "h-10 w-10 text-xs"
      }`}
    >
      {initials}
    </div>
  );
}

/* ============================================================
   STATUS BADGES
============================================================ */

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<
    string,
    string
  > = {
    PENDING:
      "border-amber-100 bg-amber-50 text-amber-700",

    CONFIRMED:
      "border-blue-100 bg-blue-50 text-blue-700",

    PROCESSING:
      "border-blue-100 bg-blue-50 text-blue-700",

    SHIPPED:
      "border-cyan-100 bg-cyan-50 text-cyan-700",

    DELIVERED:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    CANCELLED:
      "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
        config[status] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<
    string,
    string
  > = {
    PENDING:
      "border-amber-100 bg-amber-50 text-amber-700",

    PAID:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    FAILED:
      "border-red-100 bg-red-50 text-red-700",

    REFUNDED:
      "border-violet-100 bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
        config[status] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function CustomerDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />

      <div className="rounded-2xl bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-100" />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />

            <div className="h-6 w-56 animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-100 p-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          )
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100 sm:rounded-3xl" />

        <div className="h-80 animate-pulse rounded-2xl bg-slate-100 sm:rounded-3xl" />
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getInitials(
  name: string
) {
  const value =
    name.trim();

  if (!value) {
    return "CU";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    `${parts[0][0]}${parts[parts.length - 1][0]}`
  ).toUpperCase();
}

function getShortId(
  id: string
) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id.slice(-8).toUpperCase()
    : id.toUpperCase();
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Unknown date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatStatus(
  value: string
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

/* ============================================================
   ICONS
============================================================ */

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12C5.5 7.5 8.5 5.5 12 5.5C15.5 5.5 18.5 7.5 21 12C18.5 16.5 15.5 18.5 12 18.5C8.5 18.5 5.5 16.5 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CustomerIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 30 : 28;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19C3.9 15.9 5.8 14.5 9 14.5C12.2 14.5 14.1 15.9 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 11.5C18 11.5 20 13.1 20.5 15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 5.5C17.2 5.5 18.5 6.7 18.5 8.3C18.5 9.3 18 10.2 17.2 10.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
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

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4L21 19H3L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 9V13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}