"use client";

import { Category } from "@/components/categories/CategoryForm";

type CategoryListProps = {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export default function CategoryList({
  categories,
  loading,
  onEdit,
  onDelete,
}: CategoryListProps) {
  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl"
          >
            {/* Image skeleton */}
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-slate-100">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-3 p-4 sm:p-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />

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

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (!categories.length) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-3xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CategoryIcon />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
          No categories found
        </h3>

        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
          Create your first medicine category using the form.
        </p>
      </div>
    );
  }

  /* ==========================================================
     CATEGORY GRID
  ========================================================== */

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
      {categories.map((category) => (
        <article
          key={category._id}
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
          {/* ==================================================
              IMAGE AREA
          =================================================== */}

          <div
            className="
              relative
              flex
              aspect-[16/10]
              w-full
              items-center
              justify-center
              overflow-hidden
              bg-slate-100
              p-2
            "
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
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
              <div
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-emerald-50
                  via-teal-50
                  to-cyan-50
                  text-emerald-500
                "
              >
                <CategoryIcon />
              </div>
            )}

            {/* Image gradient */}
            {category.image && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/30 to-transparent" />
            )}

            {/* Status */}
            <div className="absolute left-3 top-3">
              <span
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  shadow-sm
                  backdrop-blur-sm
                  ${
                    category.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-600 text-white"
                  }
                `}
              >
                {category.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          </div>

          {/* ==================================================
              CONTENT
          =================================================== */}

          <div className="min-w-0 p-4 sm:p-5">
            {/* Name */}
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {category.name}
              </h3>

              <p className="mt-1 truncate text-[11px] font-medium text-emerald-600 sm:text-xs">
                /{category.slug}
              </p>
            </div>

            {/* Description */}
            <p className="mt-3 line-clamp-3 min-h-[60px] text-xs leading-5 text-slate-500 sm:text-sm">
              {category.description ||
                "No description available."}
            </p>

            {/* Meta */}
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  category.isActive
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              <span className="truncate text-[11px] text-slate-400">
                {category.isActive
                  ? "Available on website"
                  : "Hidden from website"}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onEdit(category)}
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
                onClick={() => onDelete(category)}
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
      ))}
    </div>
  );
}

/* ============================================================
   CATEGORY ICON
============================================================ */

function CategoryIcon({
  size = 28,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
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