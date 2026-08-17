"use client";

import { useState } from "react";

import type {
  AdminPrescription,
} from "@/components/prescriptions/PrescriptionList";

type PrescriptionDetailsProps = {
  prescription: AdminPrescription | null;
  onUpdated: (
    prescription: AdminPrescription
  ) => void;
  onClose: () => void;
};

const PRESCRIPTION_STATUSES = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
] as const;

export default function PrescriptionDetails({
  prescription,
  onUpdated,
  onClose,
}: PrescriptionDetailsProps) {
  const [status, setStatus] = useState(
    prescription?.status ?? "PENDING"
  );

  const [adminNote, setAdminNote] =
    useState(
      prescription?.adminNote ?? ""
    );

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  if (!prescription) {
    return null;
  }

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/prescriptions/${prescription._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status,
            adminNote,
          }),
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
            "Failed to update prescription"
        );
      }

      onUpdated(
        result.data as AdminPrescription
      );

      setSuccess(
        "Prescription updated successfully."
      );
    } catch (error) {
      console.error(
        "Prescription update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update prescription"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-5xl sm:rounded-3xl">
        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Prescription Review
            </p>

            <h2 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {prescription.patientName}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              #{getShortId(prescription._id)} ·{" "}
              {formatDate(
                prescription.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close prescription details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ==================================================
            CONTENT
        =================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="break-words text-sm leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm leading-5 text-emerald-700">
                {success}
              </p>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            {/* ==================================================
                PRESCRIPTION PREVIEW
            =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <p className="text-sm font-bold text-slate-900">
                  Prescription Document
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Review the uploaded prescription
                  carefully before approving it.
                </p>
              </div>

              <div className="flex min-h-[420px] items-center justify-center bg-slate-100 p-3 sm:min-h-[560px] sm:p-5">
                {prescription.image ? (
                  <img
                    src={prescription.image}
                    alt={`${prescription.patientName} prescription`}
                    className="block max-h-[520px] max-w-full rounded-xl object-contain shadow-sm sm:max-h-[680px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <PrescriptionIcon />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No prescription image
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      The uploaded document is unavailable.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ==================================================
                DETAILS + REVIEW
            =================================================== */}

            <div className="space-y-5">
              {/* Customer */}
              <InfoSection
                title="Customer Information"
                icon={<UserIcon />}
              >
                <InfoRow
                  label="Customer"
                  value={
                    prescription.user?.name ||
                    "Unknown customer"
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    prescription.user?.email ||
                    "No email"
                  }
                />
              </InfoSection>

              {/* Patient */}
              <InfoSection
                title="Patient Information"
                icon={<PatientIcon />}
              >
                <InfoRow
                  label="Patient"
                  value={
                    prescription.patientName
                  }
                />

                <InfoRow
                  label="Submitted"
                  value={formatDate(
                    prescription.createdAt
                  )}
                />
              </InfoSection>

              {/* Customer note */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-sm font-bold text-slate-900">
                  Customer Note
                </p>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 sm:text-sm">
                    {prescription.note ||
                      "No note provided by the customer."}
                  </p>
                </div>
              </section>

              {/* Review */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Admin Review
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Review Prescription
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Update the review status and leave an
                    internal note for this prescription.
                  </p>
                </div>

                {/* Status */}
                <div className="mt-5">
                  <label
                    htmlFor="prescription-status"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Status
                  </label>

                  <select
                    id="prescription-status"
                    value={status}
                    onChange={(event) => {
                      setStatus(
                        event.target
                          .value as (typeof PRESCRIPTION_STATUSES)[number]
                      );

                      setError("");
                      setSuccess("");
                    }}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  >
                    {PRESCRIPTION_STATUSES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {formatStatus(item)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Admin note */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="prescription-admin-note"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Admin Note
                    </label>

                    <span
                      className={`text-[10px] ${
                        adminNote.length > 1000
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {adminNote.length}/1000
                    </span>
                  </div>

                  <textarea
                    id="prescription-admin-note"
                    value={adminNote}
                    onChange={(event) => {
                      setAdminNote(
                        event.target.value
                      );

                      setError("");
                      setSuccess("");
                    }}
                    maxLength={1000}
                    rows={5}
                    disabled={saving}
                    placeholder="Write an internal review note..."
                    className="min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                </div>

                {/* Current reviewer */}
                {prescription.reviewedBy && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Last Reviewed By
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {prescription.reviewedBy.name}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {prescription.reviewedBy.email}
                    </p>

                    {prescription.reviewedAt && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDate(
                          prescription.reviewedAt
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={
                      saving ||
                      adminNote.length > 1000
                    }
                    className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-xs font-semibold text-white shadow-lg shadow-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Updating...
                      </>
                    ) : (
                      "Save Review"
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO SECTION
============================================================ */

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </span>

        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {children}
      </div>
    </section>
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

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
        {value}
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatStatus(value: string) {
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

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 19C6.1 15.9 8.2 14.5 12 14.5C15.8 14.5 17.9 15.9 18.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PatientIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <rect
        x="9"
        y="3"
        width="6"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 12H15M9 16H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
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