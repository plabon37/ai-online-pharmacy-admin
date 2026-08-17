"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StockAlert = {
  _id: string;
  name: string;
  stock: number;
  price: number;
  image: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  status: "LOW_STOCK" | "OUT_OF_STOCK";
};

type StockAlertResponse = {
  success: boolean;
  data: {
    alerts: StockAlert[];
    summary: {
      totalAlerts: number;
      lowStock: number;
      outOfStock: number;
    };
  } | null;
  message: string;
};

export default function StockAlertNotice() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<StockAlert[]>(
    []
  );

  const [summary, setSummary] = useState({
    totalAlerts: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [loading, setLoading] = useState(false);

  const [loaded, setLoaded] = useState(false);

  const [error, setError] = useState("");

  const loadAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/stock-alerts",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error(
          "Stock alert returned non-JSON response:",
          text.slice(0, 500)
        );

        throw new Error(
          `Stock alert API returned ${response.status}. Please check the /api/stock-alerts route.`
        );
      }

      const result =
        (await response.json()) as StockAlertResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load stock alerts"
        );
      }

      setAlerts(result.data?.alerts ?? []);

      setSummary(
        result.data?.summary ?? {
          totalAlerts: 0,
          lowStock: 0,
          outOfStock: 0,
        }
      );

      setLoaded(true);
    } catch (error) {
      console.error(
        "Stock alert load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load stock alerts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineClick = (
    medicineId: string
  ) => {
    /*
     * Go to Medicine Management page.
     *
     * We pass the medicine ID in the query so the
     * Medicine page can identify which medicine was
     * clicked from the stock alert.
     */
    router.push(
      `/dashboard/medicines?medicine=${encodeURIComponent(
        medicineId
      )}`
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertIcon />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600 sm:text-xs">
                Inventory Alert
              </p>

              <h2 className="mt-0.5 truncate text-lg font-bold text-slate-900 sm:text-xl">
                Stock Alerts
              </h2>
            </div>
          </div>

          <p className="mt-3 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
            Quickly identify medicines that are low in
            stock or currently unavailable.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
              Loading...
            </>
          ) : loaded ? (
            <>
              <RefreshIcon />
              Refresh
            </>
          ) : (
            <>
              <EyeIcon />
              Check Alerts
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary
          label="Total Alerts"
          value={summary.totalAlerts}
          className="bg-slate-50 text-slate-700"
        />

        <Summary
          label="Low Stock"
          value={summary.lowStock}
          className="bg-amber-50 text-amber-700"
        />

        <Summary
          label="Out of Stock"
          value={summary.outOfStock}
          className="bg-red-50 text-red-700"
        />
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="break-words text-xs leading-5 text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          INITIAL STATE
      ====================================================== */}

      {!loaded && !loading && !error && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <AlertIcon />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Stock status is ready to check
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Click “Check Alerts” to view the latest
            medicine stock status.
          </p>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
            >
              <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {loaded &&
        !loading &&
        alerts.length === 0 && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <CheckIcon />
            </div>

            <p className="mt-3 text-sm font-semibold text-emerald-700">
              All stock levels look good
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-600/70">
              No medicine currently needs stock attention.
            </p>
          </div>
        )}

      {/* =====================================================
          ALERT LIST
      ====================================================== */}

      {loaded &&
        !loading &&
        alerts.length > 0 && (
          <div className="mt-5 space-y-3">
            {alerts.map((alert) => (
              <button
                key={alert._id}
                type="button"
                onClick={() =>
                  handleMedicineClick(
                    alert._id
                  )
                }
                className="
                  group
                  flex
                  w-full
                  min-w-0
                  flex-col
                  gap-3
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-3
                  text-left
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-200
                  hover:bg-emerald-50/30
                  hover:shadow-md
                  active:scale-[0.995]
                  sm:flex-row
                  sm:items-center
                "
              >
                {/* Image */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {alert.image ? (
                    <img
                      src={alert.image}
                      alt={alert.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <MedicineIcon />
                  )}
                </div>

                {/* Medicine */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                    {alert.name}
                  </h3>

                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {alert.category?.name ||
                      "Uncategorized"}
                  </p>

                  <p className="mt-1 text-[10px] font-medium text-emerald-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Click to manage medicine →
                  </p>
                </div>

                {/* Stock */}
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Current Stock
                    </p>

                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        alert.status ===
                        "OUT_OF_STOCK"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {alert.stock}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      alert.status ===
                      "OUT_OF_STOCK"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {alert.status ===
                    "OUT_OF_STOCK"
                      ? "Out of Stock"
                      : "Low Stock"}
                  </span>

                  <ArrowIcon />
                </div>
              </button>
            ))}
          </div>
        )}
    </section>
  );
}

/* ============================================================
   SUMMARY
============================================================ */

function Summary({
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
      className={`rounded-xl px-4 py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

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

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12L9.5 16.5L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
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

function EyeIcon() {
  return (
    <svg
      width="15"
      height="15"
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

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-500"
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

function MedicineIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
    >
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8.5 8H15.5M8.5 12H15.5M8.5 16H12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}