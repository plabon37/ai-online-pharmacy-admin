"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RecentOrder = {
  _id: string;
  customer: string;
  email: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string | null;
};

type DashboardStatsResponse = {
  success: boolean;

  data: {
    recentOrders: RecentOrder[];
  } | null;

  message: string;
};

export default function RecentOrders() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<RecentOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD RECENT ORDERS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadRecentOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard/stats",
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
            "Recent orders returned non-JSON:",
            text.slice(0, 500)
          );

          throw new Error(
            `Dashboard API returned ${response.status}`
          );
        }

        const result =
          (await response.json()) as DashboardStatsResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Failed to load recent orders"
          );
        }

        if (mounted) {
          setOrders(
            Array.isArray(
              result.data.recentOrders
            )
              ? result.data.recentOrders
              : []
          );
        }
      } catch (error) {
        console.error(
          "Recent orders error:",
          error
        );

        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load recent orders"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecentOrders();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  const formatDate = (
    value: string | null
  ) => {
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
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };

  /* ==========================================================
     STATUS CLASS
  ========================================================== */

  const getStatusClass = (
    status: string
  ) => {
    switch (
      status.toUpperCase()
    ) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700";

      case "SHIPPED":
        return "bg-cyan-50 text-cyan-700";

      case "PROCESSING":
        return "bg-blue-50 text-blue-700";

      case "CONFIRMED":
        return "bg-teal-50 text-teal-700";

      case "CANCELLED":
        return "bg-red-50 text-red-700";

      case "PENDING":
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  /* ==========================================================
     PAYMENT CLASS
  ========================================================== */

  const getPaymentClass = (
    status: string
  ) => {
    switch (
      status.toUpperCase()
    ) {
      case "PAID":
        return "text-emerald-600";

      case "FAILED":
        return "text-red-600";

      case "REFUNDED":
        return "text-violet-600";

      case "PENDING":
      default:
        return "text-amber-600";
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Activity
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Recent Orders
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Latest customer orders from the pharmacy.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/orders"
            )
          }
          className="w-fit rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          View All Orders
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="break-words text-xs leading-5 text-red-600 sm:text-sm">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5"
              >
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />

                  <div className="h-2.5 w-48 animate-pulse rounded bg-slate-200" />
                </div>

                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
            )
          )}
        </div>
      ) : orders.length ===
        0 ? (
        /* ===================================================
           EMPTY
        ==================================================== */

        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <OrderIcon />
          </div>

          <h3 className="mt-3 text-sm font-bold text-slate-700">
            No orders yet
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Recent customer orders will appear here
            automatically.
          </p>
        </div>
      ) : (
        /* ===================================================
           ORDERS
        ==================================================== */

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
          {/* Desktop Header */}
          <div className="hidden grid-cols-[minmax(0,1.5fr)_120px_120px_100px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span>Customer</span>
            <span>Total</span>
            <span>Status</span>
            <span>Payment</span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map(
              (order) => (
                <button
                  type="button"
                  key={order._id}
                  onClick={() =>
                    router.push(
                      `/dashboard/orders?order=${encodeURIComponent(
                        order._id
                      )}`
                    )
                  }
                  className="group block w-full text-left transition hover:bg-slate-50"
                >
                  <div className="grid gap-3 px-3.5 py-4 md:grid-cols-[minmax(0,1.5fr)_120px_120px_100px] md:items-center md:px-4">
                    {/* Customer */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm">
                        {getInitials(
                          order.customer
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                          {order.customer ||
                            "Customer"}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                          {order.email ||
                            "No email"}
                        </p>

                        <p className="mt-0.5 text-[9px] text-slate-300 sm:text-[10px]">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between md:block">
                      <span className="text-[10px] text-slate-400 md:hidden">
                        Total
                      </span>

                      <span className="text-xs font-bold text-slate-800 sm:text-sm">
                        {`৳${Number(
                          order.totalAmount ||
                            0
                        ).toLocaleString(
                          "en-BD",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between md:block">
                      <span className="text-[10px] text-slate-400 md:hidden">
                        Status
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status ||
                          "PENDING"}
                      </span>
                    </div>

                    {/* Payment */}
                    <div className="flex items-center justify-between md:block">
                      <span className="text-[10px] text-slate-400 md:hidden">
                        Payment
                      </span>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${getPaymentClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus ||
                          "PENDING"}
                      </span>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </section>
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

  const parts =
    value
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

/* ============================================================
   ICON
============================================================ */

function OrderIcon() {
  return (
    <svg
      width="20"
      height="20"
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