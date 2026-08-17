"use client";

import { useState } from "react";

type PrescriptionStatsData = {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  reviewingPrescriptions: number;
  approvedPrescriptions: number;
  rejectedPrescriptions: number;
};

type PrescriptionStatsResponse = {
  success: boolean;
  data: PrescriptionStatsData | null;
  message: string;
};

export default function PrescriptionStats() {
  const [stats, setStats] =
    useState<PrescriptionStatsData | null>(null);

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/dashboard/prescription-stats",
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
          "Prescription stats non-JSON response:",
          text.slice(0, 500)
        );

        throw new Error(
          `Prescription statistics API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as PrescriptionStatsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load prescription statistics"
        );
      }

      setStats(result.data);
      setLoaded(true);
    } catch (error) {
      console.error(
        "Prescription stats error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load prescription statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Prescription Analytics
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Prescription Statistics
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
            Monitor prescription review activity from the
            admin dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
              Loading...
            </>
          ) : loaded ? (
            "Refresh"
          ) : (
            "Load Statistics"
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="break-words text-xs leading-5 text-red-600">
            {error}
          </p>
        </div>
      )}

      {!loaded &&
        !loading &&
        !error && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Prescription statistics are ready
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Click “Load Statistics” to view the latest
              numbers.
            </p>
          </div>
        )}

      {loading && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-50 p-4"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}

      {loaded && stats && !loading && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat
            label="Total"
            value={stats.totalPrescriptions}
            description="All prescriptions"
            className="bg-slate-50 text-slate-800"
          />

          <Stat
            label="Pending"
            value={stats.pendingPrescriptions}
            description="Waiting for review"
            className="bg-amber-50 text-amber-700"
          />

          <Stat
            label="Reviewing"
            value={stats.reviewingPrescriptions}
            description="Currently reviewing"
            className="bg-blue-50 text-blue-700"
          />

          <Stat
            label="Approved"
            value={stats.approvedPrescriptions}
            description="Approved documents"
            className="bg-emerald-50 text-emerald-700"
          />

          <Stat
            label="Rejected"
            value={stats.rejectedPrescriptions}
            description="Rejected documents"
            className="bg-red-50 text-red-700"
          />
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: number;
  description: string;
  className: string;
}) {
  return (
    <div className={`min-w-0 rounded-2xl p-4 ${className}`}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 truncate text-[11px] opacity-70">
        {description}
      </p>
    </div>
  );
}