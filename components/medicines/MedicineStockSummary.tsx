"use client";

import type { Medicine } from "@/components/medicines/MedicineForm";

type MedicineStockSummaryProps = {
  medicines: Medicine[];
};

export default function MedicineStockSummary({
  medicines,
}: MedicineStockSummaryProps) {
  const totalMedicines = medicines.length;

  const lowStockMedicines = medicines.filter(
    (medicine) =>
      medicine.stock > 0 && medicine.stock <= 10
  ).length;

  const outOfStockMedicines = medicines.filter(
    (medicine) => medicine.stock <= 0
  ).length;

  const inStockMedicines = medicines.filter(
    (medicine) => medicine.stock > 10
  ).length;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total */}
      <SummaryCard
        label="Total Medicines"
        value={totalMedicines}
        description="Active medicines"
        icon={<MedicineIcon />}
        iconClass="bg-emerald-50 text-emerald-600"
      />

      {/* In Stock */}
      <SummaryCard
        label="In Stock"
        value={inStockMedicines}
        description="Healthy stock level"
        icon={<CheckIcon />}
        iconClass="bg-emerald-50 text-emerald-600"
      />

      {/* Low Stock */}
      <SummaryCard
        label="Low Stock"
        value={lowStockMedicines}
        description="Needs attention"
        icon={<WarningIcon />}
        iconClass="bg-amber-50 text-amber-600"
      />

      {/* Out of Stock */}
      <SummaryCard
        label="Out of Stock"
        value={outOfStockMedicines}
        description="Currently unavailable"
        icon={<AlertIcon />}
        iconClass="bg-red-50 text-red-600"
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 truncate text-[11px] text-slate-400 sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
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

function CheckIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function WarningIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function AlertIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="15.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}