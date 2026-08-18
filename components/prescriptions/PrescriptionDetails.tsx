"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  AdminPrescription,
} from "@/components/prescriptions/PrescriptionList";

/* ============================================================
   TYPES
============================================================ */

type MatchedMedicine = {
  _id?: string;
  name?: string;
  genericName?: string;
  price?: number;
  stock?: number;
  image?: string;
  isActive?: boolean;
  category?: string;
};

type PrescriptionMedicineAI = {
  name?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;

  matchedMedicineId?:
    | string
    | MatchedMedicine
    | null;

  confidence?: number;
  needsReview?: boolean;
};

type PrescriptionTestAI = {
  name?: string;
  category?: string;
  notes?: string;
  confidence?: number;
  needsReview?: boolean;
};

type PrescriptionAIData =
  AdminPrescription & {
    extractedText?: string;
    cleanedText?: string;
    medicines?: PrescriptionMedicineAI[];
    tests?: PrescriptionTestAI[];
    aiStatus?: string;
    fileType?: string;
  };

type MedicineOption = {
  _id: string;
  name: string;
  genericName?: string;
  price?: number;
  stock?: number;
  image?: string;
  isActive?: boolean;
  category?: string;
};

type PrescriptionDetailsProps = {
  prescription:
    | AdminPrescription
    | null;

  onUpdated: (
    prescription: AdminPrescription
  ) => void;

  onClose: () => void;
};

/* ============================================================
   STATUS
============================================================ */

const PRESCRIPTION_STATUSES = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
] as const;

/* ============================================================
   MAIN WRAPPER
============================================================ */

export default function PrescriptionDetails({
  prescription,
  onUpdated,
  onClose,
}: PrescriptionDetailsProps) {
  if (!prescription) {
    return null;
  }

  return (
    <PrescriptionDetailsContent
      key={prescription._id}
      prescription={prescription}
      onUpdated={onUpdated}
      onClose={onClose}
    />
  );
}

/* ============================================================
   DETAILS CONTENT
============================================================ */

function PrescriptionDetailsContent({
  prescription,
  onUpdated,
  onClose,
}: {
  prescription: AdminPrescription;

  onUpdated: (
    prescription: AdminPrescription
  ) => void;

  onClose: () => void;
}) {
  /* ==========================================================
     REVIEW STATE
  ========================================================== */

  const [
    status,
    setStatus,
  ] = useState<
    (typeof PRESCRIPTION_STATUSES)[number]
  >(
    prescription.status ??
      "PENDING"
  );

  const [
    adminNote,
    setAdminNote,
  ] = useState(
    prescription.adminNote ??
      ""
  );

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  /* ==========================================================
     FULL PRESCRIPTION
  ========================================================== */

  const [
    fullPrescription,
    setFullPrescription,
  ] =
    useState<PrescriptionAIData>(
      prescription as PrescriptionAIData
    );

  /* ==========================================================
     MANUAL MATCH STATE
  ========================================================== */

  const [
    openMatchIndex,
    setOpenMatchIndex,
  ] = useState<
    number | null
  >(null);

  const [
    medicineSearch,
    setMedicineSearch,
  ] = useState("");

  const [
    medicineOptions,
    setMedicineOptions,
  ] = useState<
    MedicineOption[]
  >([]);

  const [
    medicineLoading,
    setMedicineLoading,
  ] = useState(false);

  const [
    matchingIndex,
    setMatchingIndex,
  ] = useState<
    number | null
  >(null);

  const [
    matchError,
    setMatchError,
  ] = useState("");

  /* ==========================================================
     LOAD COMPLETE PRESCRIPTION
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadPrescription =
      async () => {
        setAiLoading(true);

        try {
          const response =
            await fetch(
              `/api/prescriptions/${prescription._id}`,
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
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
                "Failed to load prescription details"
            );
          }

          if (cancelled) {
            return;
          }

          if (result.data) {
            setFullPrescription(
              result.data as PrescriptionAIData
            );
          }
        } catch (
          loadError
        ) {
          if (cancelled) {
            return;
          }

          console.error(
            "Load prescription details error:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Failed to load prescription details"
          );
        } finally {
          if (!cancelled) {
            setAiLoading(false);
          }
        }
      };

    void loadPrescription();

    return () => {
      cancelled = true;
    };
  }, [
    prescription._id,
  ]);

  /* ==========================================================
     DATA
  ========================================================== */

  const details =
    fullPrescription;

  const medicines =
    Array.isArray(
      details.medicines
    )
      ? details.medicines
      : [];

  const tests =
    Array.isArray(
      details.tests
    )
      ? details.tests
      : [];

  const aiStatus =
    details.aiStatus ??
    "PENDING";

  /* ==========================================================
     SEARCH MEDICINES
  ========================================================== */

  const searchMedicines =
    async (
      search = ""
    ) => {
      setMedicineLoading(
        true
      );

      setMatchError("");

      try {
        const query =
          search.trim();

        const endpoint =
          `/api/prescriptions/${details._id}/medicine-match?search=${encodeURIComponent(
            query
          )}&limit=30`;

        const response =
          await fetch(
            endpoint,
            {
              method:
                "GET",
              credentials:
                "include",
              cache:
                "no-store",
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
              "Failed to load medicine options"
          );
        }

        setMedicineOptions(
          Array.isArray(
            result.data
          )
            ? (result.data as MedicineOption[])
            : []
        );
      } catch (
        searchError
      ) {
        console.error(
          "Medicine search error:",
          searchError
        );

        setMatchError(
          searchError instanceof
            Error
            ? searchError.message
            : "Failed to search medicines"
        );
      } finally {
        setMedicineLoading(
          false
        );
      }
    };

  /* ==========================================================
     OPEN MATCH PANEL
  ========================================================== */

  const handleOpenMatch =
    (
      index: number
    ) => {
      if (
        openMatchIndex ===
        index
      ) {
        handleCloseMatch();
        return;
      }

      setOpenMatchIndex(
        index
      );

      setMedicineSearch(
        ""
      );

      setMedicineOptions(
        []
      );

      setMatchError("");

      void searchMedicines(
        ""
      );
    };

  /* ==========================================================
     CLOSE MATCH PANEL
  ========================================================== */

  const handleCloseMatch =
    () => {
      setOpenMatchIndex(
        null
      );

      setMedicineSearch(
        ""
      );

      setMedicineOptions(
        []
      );

      setMatchError("");
    };

  /* ==========================================================
     MANUAL MATCH
  ========================================================== */

  const handleManualMatch =
    async (
      medicineIndex: number,
      matchedMedicineId:
        | string
        | null
    ) => {
      setMatchingIndex(
        medicineIndex
      );

      setMatchError("");
      setError("");

      try {
        const response =
          await fetch(
            `/api/prescriptions/${details._id}/medicine-match`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  medicineIndex,
                  matchedMedicineId,
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
              "Failed to update medicine match"
          );
        }

        if (result.data) {
          setFullPrescription(
            result.data as PrescriptionAIData
          );

          onUpdated(
            result.data as AdminPrescription
          );
        }

        setSuccess(
          matchedMedicineId
            ? "Medicine match updated successfully."
            : "Medicine match removed successfully."
        );

        handleCloseMatch();
      } catch (
        matchErrorValue
      ) {
        console.error(
          "Manual medicine match error:",
          matchErrorValue
        );

        setMatchError(
          matchErrorValue instanceof
            Error
            ? matchErrorValue.message
            : "Failed to update medicine match"
        );
      } finally {
        setMatchingIndex(
          null
        );
      }
    };

  /* ==========================================================
     UPDATE REVIEW
  ========================================================== */

  const handleUpdate =
    async () => {
      setSaving(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await fetch(
            `/api/prescriptions/${prescription._id}`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
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

        setFullPrescription(
          (
            current
          ) =>
            ({
              ...current,
              ...result.data,

              extractedText:
                current.extractedText,

              cleanedText:
                current.cleanedText,

              medicines:
                current.medicines,

              tests:
                current.tests,

              aiStatus:
                current.aiStatus,
            }) as PrescriptionAIData
        );

        onUpdated(
          result.data as AdminPrescription
        );

        setSuccess(
          "Prescription updated successfully."
        );
      } catch (
        updateError
      ) {
        console.error(
          "Prescription update error:",
          updateError
        );

        setError(
          updateError instanceof
            Error
            ? updateError.message
            : "Failed to update prescription"
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[94vh] sm:max-w-6xl sm:rounded-3xl">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Prescription Review
            </p>

            <h2 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {
                details.patientName
              }
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              #
              {getShortId(
                details._id
              )}{" "}
              ·{" "}
              {formatDate(
                details.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close prescription details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ====================================================
            CONTENT
        ===================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="break-words text-sm leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm leading-5 text-emerald-700">
                {success}
              </p>
            </div>
          )}

          {/* ==================================================
              TOP
          =================================================== */}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">

            {/* LEFT */}

            <div className="space-y-5">

              {/* DOCUMENT */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-sm font-bold text-slate-900">
                    Prescription Document
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Review the uploaded prescription carefully
                    before approving it.
                  </p>
                </div>

                <div className="flex min-h-[420px] items-center justify-center bg-slate-100 p-3 sm:min-h-[560px] sm:p-5">
                  {details.image ? (
                    <img
                      src={
                        details.image
                      }
                      alt={`${details.patientName} prescription`}
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

              {/* AI STATUS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      AI Analysis
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Prescription AI Result
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      OCR, cleaning, medicine extraction,
                      database matching and test extraction.
                    </p>
                  </div>

                  <AIStatusBadge
                    status={
                      aiStatus
                    }
                  />
                </div>

                {aiLoading && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

                    <p className="text-xs text-slate-500">
                      Loading latest AI analysis...
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT */}

            <div className="space-y-5">

              <InfoSection
                title="Customer Information"
                icon={
                  <UserIcon />
                }
              >
                <InfoRow
                  label="Customer"
                  value={
                    details.user
                      ?.name ||
                    "Unknown customer"
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    details.user
                      ?.email ||
                    "No email"
                  }
                />
              </InfoSection>

              <InfoSection
                title="Patient Information"
                icon={
                  <PatientIcon />
                }
              >
                <InfoRow
                  label="Patient"
                  value={
                    details.patientName
                  }
                />

                <InfoRow
                  label="Submitted"
                  value={formatDate(
                    details.createdAt
                  )}
                />

                <InfoRow
                  label="AI Status"
                  value={formatStatus(
                    aiStatus
                  )}
                />
              </InfoSection>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-sm font-bold text-slate-900">
                  Customer Note
                </p>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 sm:text-sm">
                    {details.note ||
                      "No note provided by the customer."}
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* ==================================================
              RAW OCR
          =================================================== */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Raw OCR
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Extracted Prescription Text
            </h3>

            <div className="mt-4 max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700 sm:text-sm">
              {details.extractedText?.trim() ||
                "No OCR text is available yet."}
            </div>
          </section>

          {/* ==================================================
              CLEANED TEXT
          =================================================== */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Cleaned Text
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Normalized Prescription
            </h3>

            <div className="mt-4 max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-emerald-50/60 p-4 text-xs leading-6 text-slate-700 sm:text-sm">
              {details.cleanedText?.trim() ||
                "No cleaned text is available yet."}
            </div>
          </section>

          {/* ==================================================
              MEDICINES
          =================================================== */}

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Medicine Detection
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    AI Detected Medicines
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {medicines.length} medicine
                    {medicines.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    detected
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                  Database Matching
                </span>
              </div>
            </div>

            {medicines.length ===
            0 ? (
              <EmptyState
                title="No medicines detected"
                description="No medicine was extracted from the prescription."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <TableHeader>
                        AI Medicine
                      </TableHeader>

                      <TableHeader>
                        Matched Medicine
                      </TableHeader>

                      <TableHeader>
                        Generic
                      </TableHeader>

                      <TableHeader>
                        Strength
                      </TableHeader>

                      <TableHeader>
                        Dosage
                      </TableHeader>

                      <TableHeader>
                        Frequency
                      </TableHeader>

                      <TableHeader>
                        Duration
                      </TableHeader>

                      <TableHeader>
                        Price
                      </TableHeader>

                      <TableHeader>
                        Stock
                      </TableHeader>

                      <TableHeader>
                        Confidence
                      </TableHeader>

                      <TableHeader>
                        Review
                      </TableHeader>

                      <TableHeader>
                        Action
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {medicines.map(
                      (
                        medicine,
                        index
                      ) => {
                        const matched =
                          getMatchedMedicine(
                            medicine.matchedMedicineId
                          );

                        return (
                          <tr
                            key={`${medicine.name || "medicine"}-${index}`}
                            className="border-b border-slate-100 last:border-0"
                          >
                            {/* AI MEDICINE */}

                            <td className="px-4 py-4 align-top">
                              <p className="text-xs font-bold text-slate-800 sm:text-sm">
                                {medicine.name ||
                                  "Unknown"}
                              </p>
                            </td>

                            {/* MATCHED MEDICINE */}

                            <td className="px-4 py-4 align-top">
                              {matched ? (
                                <div className="min-w-[170px]">
                                  <div className="flex items-center gap-2">
                                    {matched.image ? (
                                      <img
                                        src={
                                          matched.image
                                        }
                                        alt={
                                          matched.name ||
                                          "Medicine"
                                        }
                                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain"
                                      />
                                    ) : (
                                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-600">
                                        RX
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-slate-800">
                                        {
                                          matched.name
                                        }
                                      </p>

                                      {matched.category && (
                                        <p className="truncate text-[9px] text-slate-400">
                                          {
                                            matched.category
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                                    Matched
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-600">
                                    Not Matched
                                  </span>

                                  {getMatchedMedicineId(
                                    medicine.matchedMedicineId
                                  ) && (
                                    <p className="mt-1 max-w-[130px] break-all text-[9px] text-slate-400">
                                      ID:{" "}
                                      {
                                        getMatchedMedicineId(
                                          medicine.matchedMedicineId
                                        )
                                      }
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* GENERIC */}

                            <td className="px-4 py-4 align-top text-xs text-slate-600">
                              {matched?.genericName ||
                                "—"}
                            </td>

                            {/* STRENGTH */}

                            <td className="px-4 py-4 align-top text-xs text-slate-600">
                              {medicine.strength ||
                                "—"}
                            </td>

                            {/* DOSAGE */}

                            <td className="px-4 py-4 align-top text-xs text-slate-600">
                              {medicine.dosage ||
                                "—"}
                            </td>

                            {/* FREQUENCY */}

                            <td className="px-4 py-4 align-top text-xs text-slate-600">
                              {medicine.frequency ||
                                "—"}
                            </td>

                            {/* DURATION */}

                            <td className="px-4 py-4 align-top text-xs text-slate-600">
                              {medicine.duration ||
                                "—"}
                            </td>

                            {/* PRICE */}

                            <td className="px-4 py-4 align-top text-xs font-semibold text-slate-700">
                              {matched?.price !==
                              undefined
                                ? formatCurrency(
                                    matched.price
                                  )
                                : "—"}
                            </td>

                            {/* STOCK */}

                            <td className="px-4 py-4 align-top">
                              {matched ? (
                                <StockBadge
                                  stock={
                                    matched.stock
                                  }
                                />
                              ) : (
                                "—"
                              )}
                            </td>

                            {/* CONFIDENCE */}

                            <td className="px-4 py-4 align-top">
                              <ConfidenceBadge
                                value={
                                  medicine.confidence
                                }
                              />
                            </td>

                            {/* REVIEW */}

                            <td className="px-4 py-4 align-top">
                              {medicine.needsReview ? (
                                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                                  Review
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                                  OK
                                </span>
                              )}
                            </td>

                            {/* ACTION */}

                            <td className="px-4 py-4 align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenMatch(
                                    index
                                  )
                                }
                                disabled={
                                  matchingIndex !==
                                  null
                                }
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {openMatchIndex ===
                                index
                                  ? "Close"
                                  : matched
                                  ? "Change Match"
                                  : "Match Medicine"}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ==================================================
              MANUAL MATCH PANEL
          =================================================== */}

          {openMatchIndex !==
            null &&
            medicines[
              openMatchIndex
            ] && (
              <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Manual Medicine Matching
                    </p>

                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      Match 
                      {
                        medicines[
                          openMatchIndex
                        ].name
                      }
                      
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Search the active medicine database and select
                      the correct medicine.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCloseMatch
                    }
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                {/* SEARCH */}

                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={
                        medicineSearch
                      }
                      onChange={(
                        event
                      ) => {
                        const value =
                          event.target
                            .value;

                        setMedicineSearch(
                          value
                        );

                        void searchMedicines(
                          value
                        );
                      }}
                      placeholder="Search by medicine name or generic name..."
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void searchMedicines(
                          medicineSearch
                        )
                      }
                      disabled={
                        medicineLoading
                      }
                      className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {medicineLoading
                        ? "Searching..."
                        : "Search"}
                    </button>
                  </div>
                </div>

                {/* MATCH ERROR */}

                {matchError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                    <p className="text-xs text-red-600">
                      {matchError}
                    </p>
                  </div>
                )}

                {/* OPTIONS */}

                <div className="mt-4">
                  {medicineLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
                      <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

                      <p className="mt-2 text-xs text-slate-400">
                        Searching medicines...
                      </p>
                    </div>
                  ) : medicineOptions.length ===
                    0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                      <p className="text-xs font-semibold text-slate-500">
                        No medicines found
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Try another medicine or generic name.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[360px] space-y-2 overflow-y-auto">
                      {medicineOptions.map(
                        (
                          medicine
                        ) => (
                          <MedicineOptionCard
                            key={
                              medicine._id
                            }
                            medicine={
                              medicine
                            }
                            loading={
                              matchingIndex ===
                              openMatchIndex
                            }
                            onSelect={() =>
                              void handleManualMatch(
                                openMatchIndex,
                                medicine._id
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* REMOVE MATCH */}

                {getMatchedMedicineId(
                  medicines[
                    openMatchIndex
                  ]?.matchedMedicineId
                ) && (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Remove current match?
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        This will mark the medicine for manual review.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleManualMatch(
                          openMatchIndex,
                          null
                        )
                      }
                      disabled={
                        matchingIndex !==
                        null
                      }
                      className="h-9 rounded-xl border border-red-200 px-3 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove Match
                    </button>
                  </div>
                )}
              </section>
            )}

          {/* ==================================================
              TESTS
          =================================================== */}

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-600">
                Test Detection
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                AI Detected Tests
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {tests.length} test
                {tests.length ===
                1
                  ? ""
                  : "s"}{" "}
                detected
              </p>
            </div>

            {tests.length ===
            0 ? (
              <EmptyState
                title="No tests detected"
                description="No diagnostic test or investigation was extracted from the prescription."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <TableHeader>
                        Test
                      </TableHeader>

                      <TableHeader>
                        Category
                      </TableHeader>

                      <TableHeader>
                        Notes
                      </TableHeader>

                      <TableHeader>
                        Confidence
                      </TableHeader>

                      <TableHeader>
                        Review
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {tests.map(
                      (
                        test,
                        index
                      ) => (
                        <tr
                          key={`${test.name || "test"}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold text-slate-800 sm:text-sm">
                              {test.name ||
                                "Unknown test"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-600">
                            {test.category ||
                              "Other"}
                          </td>

                          <td className="max-w-[320px] px-4 py-4 text-xs leading-5 text-slate-600">
                            {test.notes ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">
                            <ConfidenceBadge
                              value={
                                test.confidence
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            {test.needsReview ? (
                              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                                Review
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ==================================================
              ADMIN REVIEW
          =================================================== */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Admin Review
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Review Prescription
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Verify the AI result and update the final review
              status.
            </p>

            {/* STATUS */}

            <div className="mt-5">
              <label
                htmlFor="prescription-status"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="prescription-status"
                value={
                  status
                }
                onChange={(
                  event
                ) => {
                  setStatus(
                    event.target
                      .value as (typeof PRESCRIPTION_STATUSES)[number]
                  );

                  setError("");
                  setSuccess("");
                }}
                disabled={
                  saving
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
              >
                {PRESCRIPTION_STATUSES.map(
                  (
                    item
                  ) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {formatStatus(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ADMIN NOTE */}

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
                    adminNote.length >
                    1000
                      ? "text-red-500"
                      : "text-slate-400"
                  }`}
                >
                  {
                    adminNote.length
                  }
                  /1000
                </span>
              </div>

              <textarea
                id="prescription-admin-note"
                value={
                  adminNote
                }
                onChange={(
                  event
                ) => {
                  setAdminNote(
                    event.target
                      .value
                  );

                  setError("");
                  setSuccess("");
                }}
                maxLength={
                  1000
                }
                rows={5}
                disabled={
                  saving
                }
                placeholder="Write an internal review note..."
                className="min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
              />
            </div>

            {/* REVIEWER */}

            {details.reviewedBy && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Last Reviewed By
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {
                    details
                      .reviewedBy
                      .name
                  }
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {
                    details
                      .reviewedBy
                      .email
                  }
                </p>

                {details.reviewedAt && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDate(
                      details.reviewedAt
                    )}
                  </p>
                )}
              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving ||
                  matchingIndex !==
                    null
                }
                className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={
                  handleUpdate
                }
                disabled={
                  saving ||
                  matchingIndex !==
                    null ||
                  adminNote.length >
                    1000
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
  );
}

/* ============================================================
   MEDICINE OPTION CARD
============================================================ */

function MedicineOptionCard({
  medicine,
  loading,
  onSelect,
}: {
  medicine: MedicineOption;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm">
      {medicine.image ? (
        <img
          src={
            medicine.image
          }
          alt={
            medicine.name
          }
          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-600">
          RX
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
          {
            medicine.name
          }
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {
            medicine.genericName ||
            "Generic not available"
          }
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {medicine.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
              {
                medicine.category
              }
            </span>
          )}

          {medicine.price !==
            undefined && (
            <span className="text-[10px] font-bold text-emerald-600">
              {formatCurrency(
                medicine.price
              )}
            </span>
          )}

          <span
            className={`text-[10px] font-semibold ${
              (medicine.stock ??
                0) > 0
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {(medicine.stock ??
              0) > 0
              ? `${medicine.stock} in stock`
              : "Out of stock"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onSelect
        }
        disabled={
          loading
        }
        className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Select"}
      </button>
    </div>
  );
}

/* ============================================================
   MATCHED MEDICINE HELPER
============================================================ */

function getMatchedMedicine(
  value:
    | string
    | MatchedMedicine
    | null
    | undefined
) {
  if (
    !value ||
    typeof value ===
      "string"
  ) {
    return null;
  }

  return value;
}

/* ============================================================
   MATCHED MEDICINE ID HELPER
============================================================ */

function getMatchedMedicineId(
  value:
    | string
    | MatchedMedicine
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return value._id || "";
}

/* ============================================================
   CURRENCY
============================================================ */

function formatCurrency(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-BD",
    {
      style:
        "currency",
      currency:
        "BDT",
      maximumFractionDigits:
        2,
    }
  ).format(value);
}

/* ============================================================
   STOCK BADGE
============================================================ */

function StockBadge({
  stock,
}: {
  stock?: number;
}) {
  const safeStock =
    Number.isFinite(
      stock
    )
      ? Number(stock)
      : 0;

  if (
    safeStock <= 0
  ) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-600">
        Out of Stock
      </span>
    );
  }

  if (
    safeStock <= 10
  ) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
        {safeStock} left
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
      {safeStock} available
    </span>
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
  icon: ReactNode;
  children: ReactNode;
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
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   AI STATUS BADGE
============================================================ */

function AIStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  let className =
    "bg-slate-100 text-slate-600";

  if (
    normalized ===
    "COMPLETED"
  ) {
    className =
      "bg-emerald-50 text-emerald-700";
  } else if (
    normalized ===
      "AI_PROCESSING" ||
    normalized ===
      "OCR_PROCESSING"
  ) {
    className =
      "bg-amber-50 text-amber-700";
  } else if (
    normalized ===
    "FAILED"
  ) {
    className =
      "bg-red-50 text-red-600";
  } else if (
    normalized ===
    "OCR_COMPLETED"
  ) {
    className =
      "bg-cyan-50 text-cyan-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${className}`}
    >
      {formatStatus(
        normalized
      )}
    </span>
  );
}

/* ============================================================
   CONFIDENCE
============================================================ */

function ConfidenceBadge({
  value,
}: {
  value?: number;
}) {
  const confidence =
    Math.min(
      1,
      Math.max(
        0,
        Number(value) || 0
      )
    );

  const percentage =
    Math.round(
      confidence * 100
    );

  const className =
    percentage >= 80
      ? "text-emerald-600"
      : percentage >= 60
      ? "text-amber-600"
      : "text-red-600";

  return (
    <span
      className={`text-xs font-bold ${className}`}
    >
      {percentage}%
    </span>
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatStatus(
  value: string
) {
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