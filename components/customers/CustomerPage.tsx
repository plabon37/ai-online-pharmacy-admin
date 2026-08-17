"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import CustomerList, {
  type AdminCustomer,
} from "@/components/customers/CustomerList";

type CustomerPagination = {
  page: number;
  limit: number;
  totalCustomers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CustomerPageProps = {
  initialCustomers: AdminCustomer[];
  initialSearch?: string;
  initialPagination: CustomerPagination;
};

type CustomersApiResponse = {
  success: boolean;
  data: {
    customers: AdminCustomer[];
    pagination: CustomerPagination;
    filters: {
      search: string;
    };
  } | null;
  message: string;
};

export default function CustomerPage({
  initialCustomers,
  initialSearch = "",
  initialPagination,
}: CustomerPageProps) {
  const router = useRouter();

  const [customers, setCustomers] =
    useState<AdminCustomer[]>(
      initialCustomers
    );

  const [pagination, setPagination] =
    useState<CustomerPagination>(
      initialPagination
    );

  const [search, setSearch] =
    useState(initialSearch);

  const [appliedSearch, setAppliedSearch] =
    useState(initialSearch);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const filteredCustomers = useMemo(
    () => customers,
    [customers]
  );

  const fetchCustomers = async ({
    page,
    searchValue,
  }: {
    page: number;
    searchValue: string;
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

      if (searchValue.trim()) {
        params.set(
          "search",
          searchValue.trim()
        );
      }

      const response = await fetch(
        `/api/customers?${params.toString()}`,
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
          "Customers API returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Customers API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as CustomersApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch customers"
        );
      }

      setCustomers(
        result.data.customers
      );

      setPagination(
        result.data.pagination
      );

      setAppliedSearch(
        searchValue.trim()
      );

      const query =
        new URLSearchParams();

      if (searchValue.trim()) {
        query.set(
          "search",
          searchValue.trim()
        );
      }

      if (page > 1) {
        query.set(
          "page",
          String(page)
        );
      }

      const queryString =
        query.toString();

      router.replace(
        queryString
          ? `/dashboard/customers?${queryString}`
          : "/dashboard/customers",
        {
          scroll: false,
        }
      );
    } catch (error) {
      console.error(
        "Fetch customers error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers({
      page: 1,
      searchValue: search,
    });
  };

  const handleClearSearch = () => {
    setSearch("");

    fetchCustomers({
      page: 1,
      searchValue: "",
    });
  };

  const handlePageChange = (
    page: number
  ) => {
    if (
      loading ||
      page < 1 ||
      page > pagination.totalPages ||
      page === pagination.page
    ) {
      return;
    }

    fetchCustomers({
      page,
      searchValue: appliedSearch,
    });
  };

  const handleView = (
    customer: AdminCustomer
  ) => {
    router.push(
      `/dashboard/customers/${customer._id}`
    );
  };

  const pageNumbers = useMemo(() => {
    const totalPages =
      Number(
        pagination.totalPages
      ) || 0;

    const currentPage =
      Number(
        pagination.page
      ) || 1;

    if (totalPages <= 1) {
      return [];
    }

    const start = Math.max(
      1,
      currentPage - 2
    );

    const end = Math.min(
      totalPages,
      currentPage + 2
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
    pagination.page,
    pagination.totalPages,
  ]);

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
            Customers
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
            View registered customers and
            manage customer information from one
            place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {pagination.totalCustomers}{" "}
              {pagination.totalCustomers ===
              1
                ? "customer"
                : "customers"}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              Page {pagination.page}{" "}
              of{" "}
              {Math.max(
                1,
                pagination.totalPages
              )}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Customer Search
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Find Customer
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Search customers by name or email.
            </p>
          </div>

          <div className="w-full lg:max-w-xl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <SearchIcon />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search name or email..."
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                />

                {search && (
                  <button
                    type="button"
                    onClick={
                      handleClearSearch
                    }
                    disabled={loading}
                    aria-label="Clear customer search"
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-xs font-semibold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </button>
            </div>
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
          CUSTOMER LIST
      ====================================================== */}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Customer Management
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              All Customers
            </h2>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-slate-600">
              {filteredCustomers.length}{" "}
              shown
            </span>
          </div>
        </div>

        <CustomerList
          customers={
            filteredCustomers
          }
          loading={loading}
          onView={handleView}
        />

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-5">
            <p className="text-xs text-slate-400">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {pagination.totalPages}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handlePageChange(
                    pagination.page -
                      1
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
                      page ===
                      pagination.page
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
                    pagination.page +
                      1
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
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}