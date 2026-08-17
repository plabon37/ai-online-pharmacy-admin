"use client";

import { useMemo, useState } from "react";

import PrescriptionDetails from "@/components/prescriptions/PrescriptionDetails";

import PrescriptionList, {
  type AdminPrescription,
} from "@/components/prescriptions/PrescriptionList";

type PrescriptionPageProps = {
  initialPrescriptions: AdminPrescription[];
  initialSearch?: string;
  initialStatus?: string;
};

export default function PrescriptionPage({
  initialPrescriptions,
  initialSearch = "",
  initialStatus = "ALL",
}: PrescriptionPageProps) {
  const [prescriptions, setPrescriptions] =
    useState<AdminPrescription[]>(
      initialPrescriptions
    );

  const [selectedPrescription, setSelectedPrescription] =
    useState<AdminPrescription | null>(null);

  /* ==========================================================
     INITIAL FILTERS FROM URL
  ========================================================== */

  const [search, setSearch] =
    useState(initialSearch);

  const [statusFilter, setStatusFilter] =
    useState(initialStatus);

  /* ==========================================================
     FILTERED PRESCRIPTIONS
  ========================================================== */

  const filteredPrescriptions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return prescriptions.filter(
      (prescription) => {
        const patientName =
          prescription.patientName
            ?.toLowerCase() || "";

        const customerName =
          prescription.user?.name
            ?.toLowerCase() || "";

        const customerEmail =
          prescription.user?.email
            ?.toLowerCase() || "";

        const prescriptionId =
          prescription._id
            ?.toLowerCase() || "";

        const matchesSearch =
          !query ||
          patientName.includes(query) ||
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          prescriptionId.includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          prescription.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    prescriptions,
    search,
    statusFilter,
  ]);

  /* ==========================================================
     REVIEW
  ========================================================== */

  const handleReview = (
    prescription: AdminPrescription
  ) => {
    setSelectedPrescription(
      prescription
    );
  };

  /* ==========================================================
     UPDATED
  ========================================================== */

  const handleUpdated = (
    updatedPrescription: AdminPrescription
  ) => {
    setPrescriptions((current) =>
      current.map((item) =>
        item._id ===
        updatedPrescription._id
          ? updatedPrescription
          : item
      )
    );

    setSelectedPrescription(
      updatedPrescription
    );
  };

  /* ==========================================================
     CLOSE DETAILS
  ========================================================== */

  const handleCloseDetails = () => {
    setSelectedPrescription(null);
  };

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");

    window.history.replaceState(
      null,
      "",
      "/dashboard/prescriptions"
    );
  };

  /* ==========================================================
     UPDATE URL WHEN SEARCH IS APPLIED
  ========================================================== */

  const applySearchParams = () => {
    const params = new URLSearchParams();

    const trimmedSearch =
      search.trim();

    if (trimmedSearch) {
      params.set(
        "search",
        trimmedSearch
      );
    }

    if (statusFilter !== "ALL") {
      params.set(
        "status",
        statusFilter
      );
    }

    const queryString =
      params.toString();

    window.history.replaceState(
      null,
      "",
      queryString
        ? `/dashboard/prescriptions?${queryString}`
        : "/dashboard/prescriptions"
    );
  };

  /* ==========================================================
     COUNTS
  ========================================================== */

  const pendingCount =
    prescriptions.filter(
      (item) =>
        item.status === "PENDING"
    ).length;

  const reviewingCount =
    prescriptions.filter(
      (item) =>
        item.status === "REVIEWING"
    ).length;

  const approvedCount =
    prescriptions.filter(
      (item) =>
        item.status === "APPROVED"
    ).length;

  const rejectedCount =
    prescriptions.filter(
      (item) =>
        item.status === "REJECTED"
    ).length;

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL";

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

        <div className="pointer-events-none absolute right-1/4 top-1/2 h-24 w-24 rounded-full border border-white/10 sm:h-32 sm:w-32" />

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-200" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50 sm:text-xs">
              Pharmacy Management
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Prescriptions
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
            Review uploaded prescriptions,
            verify documents and manage
            approval status.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {prescriptions.length}{" "}
              {prescriptions.length === 1
                ? "prescription"
                : "prescriptions"}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {pendingCount} pending
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pending"
          value={pendingCount}
          description="Waiting for review"
          className="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Reviewing"
          value={reviewingCount}
          description="Currently under review"
          className="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="Approved"
          value={approvedCount}
          description="Verified prescriptions"
          className="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          description="Rejected submissions"
          className="bg-red-50 text-red-700"
        />
      </section>

      {/* =====================================================
          SEARCH / FILTER
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          {/* Search */}
          <div>
            <label
              htmlFor="prescription-search"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Search Prescriptions
            </label>

            <div className="relative">
              <SearchIcon />

              <input
                id="prescription-search"
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
                    applySearchParams();
                  }
                }}
                placeholder="Search patient, customer, email, ID..."
                autoComplete="off"
                spellCheck={false}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");

                    const params =
                      new URLSearchParams();

                    if (
                      statusFilter !==
                      "ALL"
                    ) {
                      params.set(
                        "status",
                        statusFilter
                      );
                    }

                    const query =
                      params.toString();

                    window.history.replaceState(
                      null,
                      "",
                      query
                        ? `/dashboard/prescriptions?${query}`
                        : "/dashboard/prescriptions"
                    );
                  }}
                  aria-label="Clear prescription search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="prescription-status-filter"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="prescription-status-filter"
              value={statusFilter}
              onChange={(event) => {
                const value =
                  event.target.value;

                setStatusFilter(value);

                const params =
                  new URLSearchParams();

                if (
                  search.trim()
                ) {
                  params.set(
                    "search",
                    search.trim()
                  );
                }

                if (value !== "ALL") {
                  params.set(
                    "status",
                    value
                  );
                }

                const query =
                  params.toString();

                window.history.replaceState(
                  null,
                  "",
                  query
                    ? `/dashboard/prescriptions?${query}`
                    : "/dashboard/prescriptions"
                );
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="REVIEWING">
                Reviewing
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="REJECTED">
                Rejected
              </option>
            </select>
          </div>
        </div>

        {/* Filter footer */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredPrescriptions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {prescriptions.length}
            </span>{" "}
            prescriptions
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-fit rounded-lg px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* =====================================================
          LIST
      ====================================================== */}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Prescription Management
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              All Prescriptions
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Review and manage customer-submitted
              prescriptions.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-slate-600">
              {filteredPrescriptions.length}{" "}
              shown
            </span>
          </div>
        </div>

        <PrescriptionList
          prescriptions={
            filteredPrescriptions
          }
          loading={false}
          onReview={handleReview}
        />
      </section>

      {/* =====================================================
          DETAILS
      ====================================================== */}

      {selectedPrescription && (
        <PrescriptionDetails
          prescription={
            selectedPrescription
          }
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
  value: number;
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

      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 truncate text-[11px] opacity-70 sm:text-xs">
        {description}
      </p>
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