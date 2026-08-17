"use client";

type CategoryPreviewProps = {
  name: string;
  description: string;
  image: string;
  previewImage?: string;
  isActive?: boolean;
  isEditing?: boolean;
};

export default function CategoryPreview({
  name,
  description,
  image,
  previewImage,
  isActive = true,
  isEditing = false,
}: CategoryPreviewProps) {
  const previewName =
    name.trim() || "Category Name";

  const previewDescription =
    description.trim() ||
    "Your category description will appear here.";

  const displayImage =
    previewImage?.trim() || image.trim();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
          Live Preview
        </p>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Category Preview
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              This is how the category card will look in the
              client website.
            </p>
          </div>

          <span
            className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-100">
        {/* Image Area */}
        <div className="relative flex min-h-[230px] w-full items-center justify-center overflow-hidden bg-slate-100 sm:min-h-[280px]">
          {displayImage ? (
            <img
              src={displayImage}
              alt={previewName}
              className="
                block
                max-h-[230px]
                max-w-full
                object-contain
                transition-transform
                duration-500
                hover:scale-[1.02]
                sm:max-h-[280px]
              "
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full min-h-[230px] w-full items-center justify-center sm:min-h-[280px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                <CategoryIcon />
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent p-4">
            <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
              Pharmacy Category
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {previewName}
              </h3>

              <p className="mt-1 truncate text-[11px] font-medium text-emerald-600">
                /{createPreviewSlug(previewName)}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CategoryIcon size={17} />
            </div>
          </div>

          <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm">
            {previewDescription}
          </p>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              <span>
                {isActive
                  ? "Available on website"
                  : "Hidden from website"}
              </span>
            </div>

            <button
              type="button"
              disabled
              className="h-10 rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-400"
            >
              {isEditing
                ? "Editing Preview"
                : "Preview Only"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
        <p className="text-[11px] leading-5 text-emerald-700">
          The complete image always stays visible inside the
          preview area. Nothing is cropped.
        </p>
      </div>
    </div>
  );
}

function createPreviewSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "category-name";
}

function CategoryIcon({
  size = 22,
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