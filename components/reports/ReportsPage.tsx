"use client";

import { useState } from "react";

import ReportCharts from "@/components/reports/ReportCharts";
import TopSellingMedicines from "@/components/reports/TopSellingMedicines";
import LowStockReport from "@/components/reports/LowStockReport";

type ReportMedicine = {
  _id: string;
  name: string;
  image: string;
  quantitySold?: number;
  revenue?: number;
  stock?: number;
  price?: number;
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
};

type ReportsData = {
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
  };

  revenue: {
    total: number;
  };

  medicines: {
    total: number;
    sold: number;
    lowStock: number;
    outOfStock: number;
  };

  topSellingMedicines: ReportMedicine[];

  lowStockMedicines: ReportMedicine[];
};

type ReportsResponse = {
  success: boolean;
  data: ReportsData | null;
  message: string;
};

export default function ReportsPage() {
  const [report, setReport] =
    useState<ReportsData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD REPORT
  ========================================================== */

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/reports",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text = await response.text();

        console.error(
          "Reports returned non-JSON response:",
          text.slice(0, 500)
        );

        throw new Error(
          `Reports API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as ReportsResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load reports"
        );
      }

      if (!result.data) {
        throw new Error(
          "Report data is unavailable"
        );
      }

      setReport(result.data);
      setLoaded(true);
    } catch (error) {
      console.error(
        "Load reports error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

        <div className="pointer-events-none absolute right-[18%] top-[22%] h-20 w-20 rounded-full border border-white/10 sm:h-28 sm:w-28" />

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-200" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50 sm:text-xs">
              Pharmacy Analytics
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Reports & Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
                Review pharmacy performance,
                revenue, orders and medicine
                inventory from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating...
                </>
              ) : loaded ? (
                <>
                  <RefreshIcon />
                  Refresh Report
                </>
              ) : (
                <>
                  <ChartIcon />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="break-words text-sm leading-5 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================
          INITIAL STATE
      ======================================================= */}

      {!loaded &&
        !loading &&
        !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:rounded-3xl sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ChartIcon large />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-800 sm:text-xl">
              Your reports are ready
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-slate-400 sm:text-sm">
              Generate the latest pharmacy
              report to view revenue, orders,
              medicine sales and stock
              performance.
            </p>
          </div>
        )}

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />

                <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />

                <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl"
              >
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />

                <div className="mt-5 space-y-3">
                  {[1, 2, 3, 4].map(
                    (row) => (
                      <div
                        key={row}
                        className="h-14 animate-pulse rounded-xl bg-slate-100"
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================
          REPORT
      ======================================================= */}

      {loaded &&
        report &&
        !loading && (
          <>
            {/* ==================================================
                SUMMARY
            =================================================== */}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total Revenue"
                value={`৳${Number(
                  report.revenue.total
                ).toFixed(2)}`}
                description="Non-cancelled orders"
                className="bg-emerald-50 text-emerald-700"
              />

              <SummaryCard
                label="Total Orders"
                value={
                  report.orders.total
                }
                description="All customer orders"
                className="bg-cyan-50 text-cyan-700"
              />

              <SummaryCard
                label="Medicines Sold"
                value={
                  report.medicines.sold
                }
                description="Units sold"
                className="bg-blue-50 text-blue-700"
              />

              <SummaryCard
                label="Low Stock"
                value={
                  report.medicines.lowStock
                }
                description="Needs attention"
                className="bg-amber-50 text-amber-700"
              />
            </section>

            {/* ==================================================
                ORDER OVERVIEW
            =================================================== */}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
                  Order Performance
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                  Order Overview
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MiniStat
                  label="Pending"
                  value={
                    report.orders.pending
                  }
                  className="bg-amber-50 text-amber-700"
                />

                <MiniStat
                  label="Processing"
                  value={
                    report.orders.processing
                  }
                  className="bg-blue-50 text-blue-700"
                />

                <MiniStat
                  label="Delivered"
                  value={
                    report.orders.delivered
                  }
                  className="bg-emerald-50 text-emerald-700"
                />

                <MiniStat
                  label="Cancelled"
                  value={
                    report.orders.cancelled
                  }
                  className="bg-red-50 text-red-700"
                />

                <MiniStat
                  label="Out of Stock"
                  value={
                    report.medicines.outOfStock
                  }
                  className="bg-slate-50 text-slate-700"
                />
              </div>
            </section>

            {/* ==================================================
                VISUAL ANALYTICS
            =================================================== */}

            <ReportCharts
              orders={report.orders}
              revenue={report.revenue}
              medicines={
                report.medicines
              }
            />

            {/* ==================================================
                TOP SELLING + LOW STOCK
            =================================================== */}

            <section className="grid gap-5 xl:grid-cols-2">
              <TopSellingMedicines
                medicines={
                  report.topSellingMedicines.map(
                    (medicine) => ({
                      _id: medicine._id,
                      name: medicine.name,
                      image: medicine.image,
                      quantitySold:
                        Number(
                          medicine.quantitySold ||
                            0
                        ),
                      revenue: Number(
                        medicine.revenue || 0
                      ),
                    })
                  )
                }
              />

              <LowStockReport
                medicines={
                  report.lowStockMedicines.map(
                    (medicine) => ({
                      _id: medicine._id,
                      name: medicine.name,
                      image: medicine.image,
                      stock: Number(
                        medicine.stock || 0
                      ),
                      price: Number(
                        medicine.price || 0
                      ),
                      category:
                        medicine.category || null,
                    })
                  )
                }
              />
            </section>
          </>
        )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
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
   MINI STAT
============================================================ */

function MiniStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function ChartIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 30 : 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 19V5M4 19H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M7 15L10 11L13 13L18 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11A8 8 0 1 0 18 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M20 5V11H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}