"use client";

import type {
  MedicineCategory,
} from "@/components/medicines/MedicineForm";

type MedicinePreviewProps = {
  name: string;
  genericName: string;
  category: string;
  categories: MedicineCategory[];
  description: string;
  price: string;
  stock: string;
  image: string;
  previewImage?: string;
  isEditing?: boolean;
};

export default function MedicinePreview({
  name,
  genericName,
  category,
  categories,
  description,
  price,
  stock,
  image,
  previewImage,
  isEditing = false,
}: MedicinePreviewProps) {
  const medicineName =
    name.trim() || "Medicine Name";

  const generic =
    genericName.trim() || "Generic name";

  const medicineDescription =
    description.trim() ||
    "Medicine description will appear here.";

  const displayImage =
    previewImage?.trim() || image.trim();

  const selectedCategory = categories.find(
    (item) => item._id === category
  );

  const categoryName =
    selectedCategory?.name || "Medicine Category";

  const numericPrice = Number(price);
  const hasValidPrice =
    price.trim() !== "" &&
    Number.isFinite(numericPrice);

  const numericStock = Number(stock);
  const hasValidStock =
    stock.trim() !== "" &&
    Number.isFinite(numericStock);

  const stockStatus = !hasValidStock
    ? "Stock"
    : numericStock === 0
      ? "Out of stock"
      : numericStock <= 10
        ? "Low stock"
        : "In stock";

  const stockStatusClass =
    stockStatus === "Out of stock"
      ? "bg-red-50 text-red-600"
      : stockStatus === "Low stock"
        ? "bg-amber-50 text-amber-700"
        : stockStatus === "In stock"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500";

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
          Live Preview
        </p>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Medicine Preview
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              See exactly how the medicine information will
              appear before saving.
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            {isEditing
              ? "Editing"
              : "New Medicine"}
          </span>
        </div>
      </div>

      {/* =====================================================
          MEDICINE CARD
      ====================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-100">
        {/* Image */}
        <div className="relative flex min-h-[240px] w-full items-center justify-center overflow-hidden bg-slate-100 p-3 sm:min-h-[300px]">
          {displayImage ? (
            <img
              src={displayImage}
              alt={medicineName}
              className="block max-h-[230px] max-w-full object-contain transition-transform duration-500 hover:scale-[1.02] sm:max-h-[290px]"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div className="flex min-h-[220px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 sm:min-h-[280px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                <MedicineIcon />
              </div>
            </div>
          )}

          {/* Category */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
              {categoryName}
            </span>
          </div>

          {/* Stock */}
          <div className="absolute right-3 top-3">
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${stockStatusClass}`}
            >
              {stockStatus}
            </span>
          </div>

          {/* Bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Medicine name */}
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {medicineName}
            </h3>

            <p className="mt-1 truncate text-xs font-medium text-emerald-600 sm:text-sm">
              {generic}
            </p>
          </div>

          {/* Price + Stock */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Price
              </p>

              <p className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                {hasValidPrice
                  ? `৳${numericPrice.toFixed(2)}`
                  : "৳0.00"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Stock
              </p>

              <p className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                {hasValidStock
                  ? numericStock
                  : "0"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>

            <p className="line-clamp-4 text-xs leading-6 text-slate-500 sm:text-sm">
              {medicineDescription}
            </p>
          </div>

          {/* Category info */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CategoryIcon />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">
                  Category
                </p>

                <p className="truncate text-xs font-semibold text-slate-700">
                  {categoryName}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="h-10 rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-400"
            >
              Preview Only
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          PREVIEW NOTE
      ====================================================== */}
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
        <p className="text-[11px] leading-5 text-emerald-700">
          Every field updates this preview instantly. Nothing
          is saved to MongoDB until you click the save button.
        </p>
      </div>
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

/* ============================================================
   CATEGORY ICON
============================================================ */

function CategoryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}