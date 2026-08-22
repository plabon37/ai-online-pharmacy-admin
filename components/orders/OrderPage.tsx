"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import OrderDetails from "@/components/orders/OrderDetails";

import OrderList, {
  type AdminOrder,
} from "@/components/orders/OrderList";

type OrderPagination = {
  page: number;
  limit: number;
  totalOrders: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type OrderPageProps = {
  initialOrders: AdminOrder[];

  initialPagination: OrderPagination;

  initialSearch?: string;

  initialStatus?: string;

  initialPaymentStatus?: string;

  initialOrderId?: string;

  initialSelectedOrder?: AdminOrder | null;
};

type OrdersApiResponse = {
  success: boolean;

  data: {
    orders: AdminOrder[];

    pagination: OrderPagination;

    filters: {
      search: string;
      status: string;
      paymentStatus: string;
    };
  } | null;

  message: string;
};

export default function OrderPage({
  initialOrders,
  initialPagination,
  initialSearch = "",
  initialStatus = "ALL",
  initialPaymentStatus = "ALL",
  initialSelectedOrder = null,
}: OrderPageProps) {
  /* ==========================================================
     STATE
  ========================================================== */

  const [orders, setOrders] =
    useState<AdminOrder[]>(
      initialOrders
    );

  const [pagination, setPagination] =
    useState<OrderPagination>(
      initialPagination
    );

  const [selectedOrder, setSelectedOrder] =
    useState<AdminOrder | null>(
      initialSelectedOrder
    );

  const [searchInput, setSearchInput] =
    useState(initialSearch);

  const [statusInput, setStatusInput] =
    useState(initialStatus);

  const [paymentInput, setPaymentInput] =
    useState(initialPaymentStatus);

  const [appliedSearch, setAppliedSearch] =
    useState(initialSearch);

  const [appliedStatus, setAppliedStatus] =
    useState(initialStatus);

  const [
    appliedPaymentStatus,
    setAppliedPaymentStatus,
  ] = useState(
    initialPaymentStatus
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     NORMALIZED PAGINATION VALUES

     These are calculated identically on server
     and client.
  ========================================================== */

  const safePage =
    Number.isInteger(
      Number(pagination.page)
    ) &&
    Number(pagination.page) > 0
      ? Number(pagination.page)
      : 1;

  const safeTotalPages =
    Number.isInteger(
      Number(pagination.totalPages)
    ) &&
    Number(pagination.totalPages) > 0
      ? Number(pagination.totalPages)
      : 0;

  const safeTotalOrders =
    Number.isFinite(
      Number(pagination.totalOrders)
    ) &&
    Number(pagination.totalOrders) >= 0
      ? Number(
          pagination.totalOrders
        )
      : 0;

  /* ==========================================================
     PAGE NUMBERS
  ========================================================== */

  const pageNumbers = useMemo(() => {
    if (safeTotalPages <= 1) {
      return [];
    }

    const start = Math.max(
      1,
      safePage - 2
    );

    const end = Math.min(
      safeTotalPages,
      safePage + 2
    );

    const pages: number[] = [];

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }, [
    safePage,
    safeTotalPages,
  ]);

  /* ==========================================================
     FETCH ORDERS
  ========================================================== */

  const fetchOrders = async ({
    page,
    search,
    status,
    paymentStatus,
  }: {
    page: number;
    search: string;
    status: string;
    paymentStatus: string;
  }) => {
    setLoading(true);
    setError("");

    try {
      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(page)
      );

      params.set(
        "limit",
        String(
          pagination.limit || 10
        )
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (status !== "ALL") {
        params.set(
          "status",
          status
        );
      }

      if (
        paymentStatus !== "ALL"
      ) {
        params.set(
          "paymentStatus",
          paymentStatus
        );
      }

      const response = await fetch(
        `/api/orders?${params.toString()}`,
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
          "Orders API returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Orders API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as OrdersApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch orders"
        );
      }

      setOrders(
        result.data.orders
      );

      setPagination(
        result.data.pagination
      );

      setAppliedSearch(
        search.trim()
      );

      setAppliedStatus(
        status
      );

      setAppliedPaymentStatus(
        paymentStatus
      );

      setSelectedOrder(null);
    } catch (error) {
      console.error(
        "Fetch orders error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch orders"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     APPLY FILTERS
  ========================================================== */

  const handleApplyFilters = () => {
    fetchOrders({
      page: 1,
      search: searchInput,
      status: statusInput,
      paymentStatus:
        paymentInput,
    });
  };

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  const handleClearFilters = () => {
    setSearchInput("");

    setStatusInput("ALL");

    setPaymentInput("ALL");

    fetchOrders({
      page: 1,
      search: "",
      status: "ALL",
      paymentStatus: "ALL",
    });
  };

  /* ==========================================================
     PAGE CHANGE
  ========================================================== */

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > safeTotalPages ||
      page === safePage ||
      loading
    ) {
      return;
    }

    fetchOrders({
      page,
      search: appliedSearch,
      status: appliedStatus,
      paymentStatus:
        appliedPaymentStatus,
    });
  };

  /* ==========================================================
     VIEW ORDER
  ========================================================== */

  const handleView = (
    order: AdminOrder
  ) => {
    setSelectedOrder(order);
    setError("");
  };

  /* ==========================================================
     UPDATE ORDER
  ========================================================== */

  const handleUpdated = (
    updatedOrder: AdminOrder
  ) => {
    setOrders((current) =>
      current.map((item) =>
        item._id ===
        updatedOrder._id
          ? updatedOrder
          : item
      )
    );

    setSelectedOrder(
      updatedOrder
    );

    setError("");
  };

  /* ==========================================================
     CLOSE DETAILS
  ========================================================== */

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  /* ==========================================================
     FILTER STATE
  ========================================================== */

  const hasActiveFilters =
    appliedSearch !== "" ||
    appliedStatus !== "ALL" ||
    appliedPaymentStatus !==
      "ALL";

  /* ==========================================================
     DISPLAY TEXT

     IMPORTANT:
     Keep these as complete strings to avoid
     hydration whitespace mismatch.
  ========================================================== */

  const ordersSummaryText =
    `${safeTotalOrders} ${
      safeTotalOrders === 1
        ? "order"
        : "orders"
    }`;

  const pageSummaryText =
    safeTotalPages > 0
      ? `Page ${safePage} of ${safeTotalPages}`
      : "No pages";

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-200" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50 sm:text-xs">
              Pharmacy Management
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Orders
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
            Monitor customer orders,
            payment status and delivery
            progress from one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {ordersSummaryText}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {pageSummaryText}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH / FILTER
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <label
              htmlFor="order-search"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Search Orders
            </label>

            <input
              id="order-search"
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleApplyFilters();
                }
              }}
              placeholder="Search customer, email, order ID..."
              autoComplete="off"
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="order-status-filter"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Order Status
              </label>

              <select
                id="order-status-filter"
                value={statusInput}
                onChange={(event) =>
                  setStatusInput(
                    event.target.value
                  )
                }
                disabled={loading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="PROCESSING">
                  Processing
                </option>

                <option value="SHIPPED">
                  Shipped
                </option>

                <option value="DELIVERED">
                  Delivered
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="payment-filter"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Payment
              </label>

              <select
                id="payment-filter"
                value={paymentInput}
                onChange={(event) =>
                  setPaymentInput(
                    event.target.value
                  )
                }
                disabled={loading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
              >
                <option value="ALL">
                  All payments
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="PAID">
                  Paid
                </option>

                <option value="FAILED">
                  Failed
                </option>

                <option value="REFUNDED">
                  Refunded
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            {orders.length} orders on this page
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={
                handleClearFilters
              }
              disabled={
                loading ||
                !hasActiveFilters
              }
              className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={
                handleApplyFilters
              }
              disabled={loading}
              className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-xs font-semibold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Loading...
                </>
              ) : (
                "Apply Filters"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="break-words text-sm leading-5 text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          ORDERS
      ====================================================== */}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Order Management
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              All Orders
            </h2>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-slate-600">
              {`Page ${safePage}`}
            </span>
          </div>
        </div>

        <OrderList
          orders={orders}
          loading={loading}
          onView={handleView}
        />

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {safeTotalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-5">
            <p className="text-xs text-slate-400">
              {`Page ${safePage} of ${safeTotalPages}`}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handlePageChange(
                    safePage - 1
                  )
                }
                disabled={
                  loading ||
                  !pagination.hasPreviousPage
                }
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    disabled={loading}
                    className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                      page === safePage
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  handlePageChange(
                    safePage + 1
                  )
                }
                disabled={
                  loading ||
                  !pagination.hasNextPage
                }
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          ORDER DETAILS
      ====================================================== */}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onUpdated={
            handleUpdated
          }
          onClose={
            handleCloseDetails
          }
        />
      )}
    </div>
  );
}