"use client";

import {
  useState,
} from "react";

import type {
  PrescriptionStatus,
} from "@/lib/models/Prescription";

/* ============================================================
   TYPES
============================================================ */

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

  reviewedAt:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
};

/* ============================================================
   PROPS
============================================================ */

type PrescriptionListProps = {
  prescriptions: AdminPrescription[];

  loading: boolean;

  onReview: (
    prescription: AdminPrescription
  ) => void;

  /*
   * Optional callback.
   *
   * If parent provides it, it will be called after successful
   * deletion.
   *
   * If parent does not provide it, the component refreshes
   * the page automatically.
   */
  onDeleted?: (
    prescriptionId: string
  ) => void;
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function PrescriptionList({
  prescriptions,
  loading,
  onReview,
  onDeleted,
}: PrescriptionListProps) {
  /* ==========================================================
     DELETE STATE
  ========================================================== */

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<AdminPrescription | null>(
      null
    );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const [
    deleteSuccess,
    setDeleteSuccess,
  ] = useState("");

  /* ==========================================================
     OPEN DELETE CONFIRMATION
  ========================================================== */

  const handleAskDelete =
    (
      prescription: AdminPrescription
    ) => {
      if (deleting) {
        return;
      }

      setDeleteTarget(
        prescription
      );

      setDeleteError(
        ""
      );

      setDeleteSuccess(
        ""
      );
    };

  /* ==========================================================
     CLOSE DELETE CONFIRMATION
  ========================================================== */

  const handleCancelDelete =
    () => {
      if (deleting) {
        return;
      }

      setDeleteTarget(
        null
      );

      setDeleteError(
        ""
      );
    };

  /* ==========================================================
     DELETE PRESCRIPTION
  ========================================================== */

  const handleConfirmDelete =
    async () => {
      if (
        !deleteTarget ||
        deleting
      ) {
        return;
      }

      setDeleting(
        true
      );

      setDeleteError(
        ""
      );

      setDeleteSuccess(
        ""
      );

      try {
        const response =
          await fetch(
            `/api/prescriptions/${deleteTarget._id}`,
            {
              method:
                "DELETE",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to delete prescription"
          );
        }

        /* ====================================================
           SUCCESS
        ==================================================== */

        const deletedId =
          deleteTarget._id;

        setDeleteTarget(
          null
        );

        setDeleteSuccess(
          "Prescription deleted successfully."
        );

        /*
         * Preferred:
         * let parent update its own state.
         */

        if (onDeleted) {
          onDeleted(
            deletedId
          );

          return;
        }

        /*
         * Fallback:
         * refresh page when parent does not provide callback.
         */

        window.location.reload();
      } catch (
        error
      ) {
        console.error(
          "Delete prescription error:",
          error
        );

        setDeleteError(
          error instanceof
            Error
            ? error.message
            : "Failed to delete prescription"
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <PrescriptionListSkeleton />
    );
  }

  /* ==========================================================
     EMPTY
  ========================================================== */

  if (
    !prescriptions.length
  ) {
    return (
      <PrescriptionEmptyState />
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">

        {/* =====================================================
            DESKTOP
        ====================================================== */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1120px] border-collapse">
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
                (
                  prescription
                ) => (
                  <PrescriptionTableRow
                    key={
                      prescription._id
                    }
                    prescription={
                      prescription
                    }
                    onReview={
                      onReview
                    }
                    onDelete={
                      handleAskDelete
                    }
                    deleting={
                      deleting
                    }
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
            (
              prescription
            ) => (
              <PrescriptionMobileCard
                key={
                  prescription._id
                }
                prescription={
                  prescription
                }
                onReview={
                  onReview
                }
                onDelete={
                  handleAskDelete
                }
                deleting={
                  deleting
                }
              />
            )
          )}
        </div>
      </div>

      {/* =======================================================
          DELETE FEEDBACK
      ====================================================== */}

      {deleteSuccess && (
        <div
          role="status"
          className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <p className="text-sm font-medium text-emerald-700">
            {
              deleteSuccess
            }
          </p>
        </div>
      )}

      {/* =======================================================
          DELETE MODAL
      ====================================================== */}

      {deleteTarget && (
        <DeletePrescriptionModal
          prescription={
            deleteTarget
          }
          deleting={
            deleting
          }
          error={
            deleteError
          }
          onCancel={
            handleCancelDelete
          }
          onConfirm={
            handleConfirmDelete
          }
        />
      )}
    </>
  );
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function PrescriptionTableRow({
  prescription,
  onReview,
  onDelete,
  deleting,
}: {
  prescription: AdminPrescription;

  onReview: (
    prescription: AdminPrescription
  ) => void;

  onDelete: (
    prescription: AdminPrescription
  ) => void;

  deleting: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/70">

      {/* ======================================================
          PATIENT
      ====================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[170px] truncate text-sm font-bold text-slate-900">
            {
              prescription.patientName
            }
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            #
            {getShortId(
              prescription._id
            )}
          </p>
        </div>
      </td>

      {/* ======================================================
          CUSTOMER
      ====================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
            {
              prescription.user
                ?.name ||
              "Unknown customer"
            }
          </p>

          <p className="mt-1 max-w-[200px] truncate text-[11px] text-slate-400">
            {
              prescription.user
                ?.email ||
              "No email"
            }
          </p>
        </div>
      </td>

      {/* ======================================================
          IMAGE
      ====================================================== */}

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() =>
            onReview(
              prescription
            )
          }
          aria-label={`Review prescription for ${prescription.patientName}`}
          className="group flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          {prescription.image ? (
            <img
              src={
                prescription.image
              }
              alt={`${prescription.patientName} prescription`}
              loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <PrescriptionIcon />
          )}
        </button>
      </td>

      {/* ======================================================
          STATUS
      ====================================================== */}

      <td className="px-5 py-4">
        <PrescriptionStatusBadge
          status={
            prescription.status
          }
        />
      </td>

      {/* ======================================================
          DATE
      ====================================================== */}

      <td className="px-5 py-4">
        <p className="text-xs font-medium text-slate-700">
          {formatDate(
            prescription.createdAt
          )}
        </p>
      </td>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">

          {/* REVIEW */}

          <button
            type="button"
            onClick={() =>
              onReview(
                prescription
              )
            }
            disabled={
              deleting
            }
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review
          </button>

          {/* DELETE */}

          <button
            type="button"
            onClick={() =>
              onDelete(
                prescription
              )
            }
            disabled={
              deleting
            }
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>

        </div>
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
  onDelete,
  deleting,
}: {
  prescription: AdminPrescription;

  onReview: (
    prescription: AdminPrescription
  ) => void;

  onDelete: (
    prescription: AdminPrescription
  ) => void;

  deleting: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* ======================================================
          IMAGE
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          onReview(
            prescription
          )
        }
        className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100"
      >
        {prescription.image ? (
          <img
            src={
              prescription.image
            }
            alt={`${prescription.patientName} prescription`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <PrescriptionIcon />
        )}
      </button>

      {/* ======================================================
          PATIENT
      ====================================================== */}

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Patient
            </p>

            <h3 className="mt-1 truncate text-sm font-bold text-slate-900">
              {
                prescription.patientName
              }
            </h3>

            <p className="mt-1 text-[10px] text-slate-400">
              #
              {getShortId(
                prescription._id
              )}
            </p>
          </div>

          <PrescriptionStatusBadge
            status={
              prescription.status
            }
          />

        </div>
      </div>

      {/* ======================================================
          CUSTOMER
      ====================================================== */}

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Customer
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {
            prescription.user
              ?.name ||
            "Unknown customer"
          }
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {
            prescription.user
              ?.email ||
            "No email"
          }
        </p>
      </div>

      {/* ======================================================
          SUBMITTED
      ====================================================== */}

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

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="mt-4 grid grid-cols-2 gap-2">

        <button
          type="button"
          onClick={() =>
            onReview(
              prescription
            )
          }
          disabled={
            deleting
          }
          className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review
        </button>

        <button
          type="button"
          onClick={() =>
            onDelete(
              prescription
            )
          }
          disabled={
            deleting
          }
          className="h-10 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>

      </div>
    </article>
  );
}

/* ============================================================
   DELETE MODAL
============================================================ */

function DeletePrescriptionModal({
  prescription,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  prescription: AdminPrescription;

  deleting: boolean;

  error: string;

  onCancel: () => void;

  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-prescription-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* ==================================================
            MODAL HEADER
        ================================================== */}

        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TrashIcon />
            </div>

            <div className="min-w-0">
              <h2
                id="delete-prescription-title"
                className="text-base font-bold text-slate-900 sm:text-lg"
              >
                Delete Prescription?
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                This action cannot be undone.
              </p>
            </div>

          </div>
        </div>

        {/* ==================================================
            MODAL CONTENT
        ================================================== */}

        <div className="px-5 py-5 sm:px-6">

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Prescription
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-900">
              {
                prescription.patientName
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              #
              {getShortId(
                prescription._id
              )}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs leading-5 text-red-700">
              The prescription record will be permanently
              removed. The uploaded prescription file will
              also be removed from cloud storage when possible.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="break-words text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

        </div>

        {/* ==================================================
            MODAL ACTIONS
        ================================================== */}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              deleting
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              deleting
            }
            className="flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon
                  small
                />
                <span className="ml-2">
                  Delete Prescription
                </span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
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
      label:
        "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },

    REVIEWING: {
      label:
        "Reviewing",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },

    APPROVED: {
      label:
        "Approved",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },

    REJECTED: {
      label:
        "Rejected",
      className:
        "bg-red-50 text-red-700 border-red-100",
    },
  };

  const current =
    config[status];

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

        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            item
          ) => (
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

              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
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
        Customer prescription submissions will appear here
        for review.
      </p>

    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getShortId(
  id: string
) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id
        .slice(-8)
        .toUpperCase()
    : id.toUpperCase();
}

function formatDate(
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
      timeZone:
        "Asia/Dhaka",

      day: "2-digit",

      month: "short",

      year: "numeric",
    }
  ).format(date);
}

/* ============================================================
   PRESCRIPTION ICON
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

/* ============================================================
   TRASH ICON
============================================================ */

function TrashIcon({
  small = false,
}: {
  small?: boolean;
}) {
  const size =
    small
      ? 15
      : 19;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10 11V17M14 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M6.5 7L7.2 19C7.25 19.85 7.95 20.5 8.8 20.5H15.2C16.05 20.5 16.75 19.85 16.8 19L17.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 7V4.8C9 4.36 9.36 4 9.8 4H14.2C14.64 4 15 4.36 15 4.8V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}