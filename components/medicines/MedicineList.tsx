"use client";

import type {
  Medicine,
} from "@/components/medicines/MedicineForm";

type MedicineListProps = {
  medicines: Medicine[];
  loading: boolean;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
};

export default function MedicineList({
  medicines,
  loading,
  onEdit,
  onDelete,
}: MedicineListProps) {
  if (loading) {
    return <MedicineListSkeleton />;
  }

  if (!medicines.length) {
    return <MedicineEmptyState />;
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
      {medicines.map((medicine) => (
        <MedicineCard
          key={medicine._id}
          medicine={medicine}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/* ============================================================
   MEDICINE CARD
============================================================ */

function MedicineCard({
  medicine,
  onEdit,
  onDelete,
}: {
  medicine: Medicine;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
}) {
  const categoryName =
    typeof medicine.category === "string"
      ? "Category"
      : medicine.category?.name || "Category";

  const stockStatus = getStockStatus(medicine.stock);

  return (
    <article
      className="
        group
        min-w-0
        overflow-hidden
        rounded-2xl
        border
        border-slate-200/80
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        sm:rounded-3xl
      "
    >
      {/* =====================================================
          IMAGE
      ====================================================== */}
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-slate-100 p-2">
        {medicine.image ? (
          <img
            src={medicine.image}
            alt={medicine.name}
            loading="lazy"
            className="
              block
              max-h-full
              max-w-full
              object-contain
              transition-transform
              duration-500
              group-hover:scale-[1.02]
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-emerald-500">
            <MedicineIcon />
          </div>
        )}

        {/* Category */}
        <div className="absolute left-3 top-3 max-w-[60%]">
          <span className="block truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
            {categoryName}
          </span>
        </div>

        {/* Stock */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ${stockStatus.className}`}
          >
            {stockStatus.label}
          </span>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div className="min-w-0 p-4 sm:p-5">
        {/* Name */}
        <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
          {medicine.name}
        </h3>

        {/* Generic */}
        <p className="mt-1 truncate text-xs font-medium text-emerald-600">
          {medicine.genericName ||
            "Generic name not available"}
        </p>

        {/* Price / Stock */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Price
            </p>

            <p className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">
              ৳{Number(medicine.price).toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Stock
            </p>

            <p className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">
              {medicine.stock}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 min-h-[60px] line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm">
          {medicine.description ||
            "No description available."}
        </p>

        {/* Meta */}
        <div className="mt-4 flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${stockStatus.dotClass}`}
          />

          <span className="truncate text-[11px] text-slate-400">
            {stockStatus.description}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onEdit(medicine)}
            className="
              h-10
              rounded-xl
              border
              border-slate-200
              px-3
              text-xs
              font-semibold
              text-slate-700
              transition-all
              duration-200
              hover:border-emerald-200
              hover:bg-emerald-50
              hover:text-emerald-700
              active:scale-[0.98]
            "
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(medicine)}
            className="
              h-10
              rounded-xl
              border
              border-red-100
              bg-red-50
              px-3
              text-xs
              font-semibold
              text-red-600
              transition-all
              duration-200
              hover:bg-red-100
              active:scale-[0.98]
            "
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   STOCK STATUS
============================================================ */

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      description: "Medicine is currently unavailable",
      className: "bg-red-50 text-red-600",
      dotClass: "bg-red-500",
    };
  }

  if (stock <= 10) {
    return {
      label: "Low stock",
      description: "Stock needs attention",
      className: "bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
    };
  }

  return {
    label: "In stock",
    description: "Medicine is available",
    className: "bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  };
}

/* ============================================================
   LOADING
============================================================ */

function MedicineListSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl"
        >
          <div className="flex aspect-[16/10] items-center justify-center bg-slate-100">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />

            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>

            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function MedicineEmptyState() {
  return (
    <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-3xl sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <MedicineIcon />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
        No medicines found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
        Create a medicine or change your search term to
        see results here.
      </p>
    </div>
  );
}

/* ============================================================
   MEDICINE ICON
============================================================ */

function MedicineIcon() {
  return (
    <svg
      width="28"
      height="28"
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