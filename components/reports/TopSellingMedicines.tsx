"use client";

import { useRouter } from "next/navigation";

export type TopSellingMedicine = {
  _id: string;
  name: string;
  image: string;
  quantitySold: number;
  revenue: number;
};

type TopSellingMedicinesProps = {
  medicines: TopSellingMedicine[];
};

export default function TopSellingMedicines({
  medicines,
}: TopSellingMedicinesProps) {
  const router = useRouter();

  const handleMedicineClick = (
    medicineId: string
  ) => {
    router.push(
      `/dashboard/medicines?medicine=${encodeURIComponent(
        medicineId
      )}`
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      {/* Header */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
        Sales Performance
      </p>

      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Top Selling Medicines
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Medicines with the highest number of units sold.
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 sm:text-xs">
          Top {medicines.length}
        </span>
      </div>

      {/* List */}
      <div className="mt-5 space-y-3">
        {medicines.length > 0 ? (
          medicines.map((medicine, index) => (
            <button
              key={
                medicine._id ||
                `${medicine.name}-${index}`
              }
              type="button"
              onClick={() =>
                handleMedicineClick(
                  medicine._id
                )
              }
              className="
                group
                flex
                w-full
                min-w-0
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-100
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
              "
            >
              {/* Rank */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                {index + 1}
              </div>

              {/* Image */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {medicine.image ? (
                  <img
                    src={medicine.image}
                    alt={medicine.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <MedicineIcon />
                )}
              </div>

              {/* Medicine info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                  {medicine.name}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {medicine.quantitySold}{" "}
                  {medicine.quantitySold === 1
                    ? "unit"
                    : "units"}{" "}
                  sold
                </p>

                <p className="mt-1 text-[10px] font-medium text-emerald-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Click to manage →
                </p>
              </div>

              {/* Revenue + arrow */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-700 sm:text-sm">
                    ৳
                    {Number(
                      medicine.revenue
                    ).toFixed(2)}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    revenue
                  </p>
                </div>

                <ArrowIcon />
              </div>
            </button>
          ))
        ) : (
          <EmptyState text="No medicine sales data available yet." />
        )}
      </div>
    </section>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-xs text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   ARROW
============================================================ */

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-500"
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

/* ============================================================
   MEDICINE ICON
============================================================ */

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