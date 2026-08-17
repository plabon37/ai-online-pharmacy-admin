"use client";

import type {
  PrescriptionStatus,
} from "@/lib/models/Prescription";

export type AdminPrescription = {
  _id: string;

  user:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | null;

  patientName: string;

  image: string;

  note: string;

  adminNote: string;

  status: PrescriptionStatus;

  reviewedBy:
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      }
    | null;

  reviewedAt: string | null;

  createdAt: string;

  updatedAt: string;
};

type PrescriptionListProps = {
  prescriptions: AdminPrescription[];
  loading: boolean;
  onReview: (
    prescription: AdminPrescription
  ) => void;
};

export default function PrescriptionList({
  prescriptions,
  loading,
  onReview,
}: PrescriptionListProps) {
  if (loading) {
    return <PrescriptionListSkeleton />;
  }

  if (!prescriptions.length) {
    return <PrescriptionEmptyState />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
      {/* =====================================================
          DESKTOP
      ====================================================== */}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[950px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Patient
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Prescription
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Status
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Submitted
              </th>

              <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {prescriptions.map(
              (prescription) => (
                <PrescriptionTableRow
                  key={prescription._id}
                  prescription={
                    prescription
                  }
                  onReview={onReview}
                />
              )
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          MOBILE
      ====================================================== */}

      <div className="grid gap-3 p-3 md:hidden">
        {prescriptions.map(
          (prescription) => (
            <PrescriptionMobileCard
              key={prescription._id}
              prescription={
                prescription
              }
              onReview={onReview}
            />
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function PrescriptionTableRow({
  prescription,
  onReview,
}: {
  prescription: AdminPrescription;
  onReview: (
    prescription: AdminPrescription
  ) => void;
}) {
  return (
    <tr className="border-b border-slate-100 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/70">
      {/* Patient */}
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[170px] truncate text-sm font-bold text-slate-900">
            {prescription.patientName}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            #{getShortId(prescription._id)}
          </p>
        </div>
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
            {prescription.user?.name ||
              "Unknown customer"}
          </p>

          <p className="mt-1 max-w-[200px] truncate text-[11px] text-slate-400">
            {prescription.user?.email ||
              "No email"}
          </p>
        </div>
      </td>

      {/* Image */}
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() =>
            onReview(prescription)
          }
          aria-label={`Review prescription for ${prescription.patientName}`}
          className="group flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          {prescription.image ? (
            <img
              src={prescription.image}
              alt={`${prescription.patientName} prescription`}
              loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <PrescriptionIcon />
          )}
        </button>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <PrescriptionStatusBadge
          status={prescription.status}
        />
      </td>

      {/* Date */}
      <td className="px-5 py-4">
        <p className="text-xs font-medium text-slate-700">
          {formatDate(
            prescription.createdAt
          )}
        </p>
      </td>

      {/* Action */}
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() =>
            onReview(prescription)
          }
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-95"
        >
          Review
        </button>
      </td>
    </tr>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function PrescriptionMobileCard({
  prescription,
  onReview,
}: {
  prescription: AdminPrescription;
  onReview: (
    prescription: AdminPrescription
  ) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Image */}
      <button
        type="button"
        onClick={() =>
          onReview(prescription)
        }
        className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100"
      >
        {prescription.image ? (
          <img
            src={prescription.image}
            alt={`${prescription.patientName} prescription`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <PrescriptionIcon />
        )}
      </button>

      {/* Patient */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Patient
            </p>

            <h3 className="mt-1 truncate text-sm font-bold text-slate-900">
              {prescription.patientName}
            </h3>
          </div>

          <PrescriptionStatusBadge
            status={prescription.status}
          />
        </div>
      </div>

      {/* Customer */}
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Customer
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {prescription.user?.name ||
            "Unknown customer"}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {prescription.user?.email ||
            "No email"}
        </p>
      </div>

      {/* Submitted */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
        <span className="text-xs font-medium text-slate-500">
          Submitted
        </span>

        <span className="text-xs font-semibold text-slate-700">
          {formatDate(
            prescription.createdAt
          )}
        </span>
      </div>

      {/* Review */}
      <button
        type="button"
        onClick={() =>
          onReview(prescription)
        }
        className="mt-4 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-[0.99]"
      >
        Review Prescription
      </button>
    </article>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function PrescriptionStatusBadge({
  status,
}: {
  status: AdminPrescription["status"];
}) {
  const config: Record<
    AdminPrescription["status"],
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

    REVIEWING: {
      label: "Reviewing",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },

    APPROVED: {
      label: "Approved",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },

    REJECTED: {
      label: "Rejected",
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

/* ============================================================
   LOADING SKELETON
============================================================ */

function PrescriptionListSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(
          (item) => (
            <div
              key={item}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
            >
              <div className="h-14 w-20 animate-pulse rounded-xl bg-slate-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />

                <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />

              <div className="h-9 w-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function PrescriptionEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-3xl sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <PrescriptionIcon />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
        No prescriptions found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
        Customer prescription submissions will
        appear here for review.
      </p>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getShortId(id: string) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id.slice(-8).toUpperCase()
    : id.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

/* ============================================================
   ICON
============================================================ */

function PrescriptionIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 8H16M8 11H16M8 14H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15 15.5L18 18.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="13.5"
        cy="13.5"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}