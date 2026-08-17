"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  href: string;
};

export default function GlobalSearch() {
  const router = useRouter();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);

    const trimmedQuery = value.trim();

    setIsOpen(Boolean(trimmedQuery));

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();

      abortRef.current = controller;

      setLoading(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setResults([]);
          return;
        }

        const result = await response.json();

        if (!result?.success) {
          setResults([]);
          return;
        }

        setResults(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Global search error:", error);

        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);
  };

  const handleResultClick = (href: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    setQuery("");
    setResults([]);
    setLoading(false);
    setIsOpen(false);

    router.push(href);
  };

  const handleClear = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setQuery("");
    setResults([]);
    setLoading(false);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
    >
      {/* =====================================================
          SEARCH INPUT
      ====================================================== */}
      <div className="relative w-full">
        {/* Search Icon */}
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-slate-400 sm:left-4">
          <SearchIcon />
        </span>

        {/* Input */}
        <input
          type="search"
          value={query}
          onChange={(event) =>
            handleSearch(event.target.value)
          }
          onFocus={handleFocus}
          placeholder="Search medicines, customers, orders..."
          autoComplete="off"
          spellCheck={false}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-slate-200
            bg-slate-50/80
            pl-10
            pr-10
            text-xs
            font-medium
            text-slate-800
            outline-none
            transition-all
            duration-200
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-emerald-500
            focus:bg-white
            focus:ring-4
            focus:ring-emerald-500/10
            sm:h-12
            sm:pl-11
            sm:pr-11
            sm:text-sm
          "
        />

        {/* Loading / Clear */}
        {loading ? (
          <span className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center sm:right-4">
            <Spinner />
          </span>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="
              absolute
              right-2.5
              top-1/2
              flex
              h-7
              w-7
              -translate-y-1/2
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition-colors
              duration-200
              hover:bg-slate-200
              hover:text-slate-700
              active:scale-95
              sm:right-3
            "
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      {/* =====================================================
          SEARCH RESULTS
      ====================================================== */}
      {isOpen && query.trim() && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[60]
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-[0_20px_60px_rgba(15,23,42,0.15)]
          "
        >
          <div className="max-h-[min(420px,calc(100vh-150px))] overflow-y-auto p-1.5 sm:p-2">
            {/* Loading */}
            {loading ? (
              <SearchSkeleton />
            ) : results.length > 0 ? (
              /* Results */
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() =>
                      handleResultClick(result.href)
                    }
                    className="
                      group
                      flex
                      w-full
                      min-w-0
                      items-center
                      gap-2.5
                      rounded-xl
                      px-2.5
                      py-2.5
                      text-left
                      transition-all
                      duration-200
                      hover:bg-emerald-50
                      active:scale-[0.995]
                      sm:gap-3
                      sm:px-3
                      sm:py-3
                    "
                  >
                    {/* Result Icon */}
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-50
                        text-slate-500
                        transition-colors
                        duration-200
                        group-hover:bg-white
                        group-hover:text-emerald-600
                        sm:h-10
                        sm:w-10
                      "
                    >
                      <ResultIcon type={result.type} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
                        {result.title}
                      </p>

                      {result.subtitle && (
                        <p className="mt-0.5 truncate text-[10px] leading-4 text-slate-500 sm:text-xs">
                          {result.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Type */}
                    <span
                      className="
                        hidden
                        shrink-0
                        rounded-full
                        bg-slate-100
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                        group-hover:bg-emerald-100
                        group-hover:text-emerald-700
                        xs:inline-flex
                        sm:text-[10px]
                      "
                    >
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* No Results */
              <div className="px-4 py-8 text-center sm:py-10">
                <div
                  className="
                    mx-auto
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-50
                    text-slate-400
                    sm:h-12
                    sm:w-12
                  "
                >
                  <SearchIcon size={19} />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-700 sm:text-sm">
                  No results found
                </p>

                <p className="mx-auto mt-1 max-w-[260px] text-[11px] leading-5 text-slate-400 sm:text-xs">
                  Try another medicine, customer, order or
                  category.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function SearchSkeleton() {
  return (
    <div className="space-y-2 p-1">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 sm:px-3 sm:py-3"
        >
          {/* Icon */}
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-100 sm:h-10 sm:w-10" />

          {/* Text */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />

            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>

          {/* Type */}
          <div className="hidden h-5 w-14 animate-pulse rounded-full bg-slate-100 xs:block" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   RESULT ICON
============================================================ */

function ResultIcon({
  type,
}: {
  type: string;
}) {
  switch (type.toLowerCase()) {
    case "medicine":
      return <MedicineIcon />;

    case "customer":
      return <CustomerIcon />;

    case "order":
      return <OrderIcon />;

    case "category":
      return <CategoryIcon />;

    case "prescription":
      return <PrescriptionIcon />;

    default:
      return <SearchIcon size={18} />;
  }
}

/* ============================================================
   SEARCH ICON
============================================================ */

function SearchIcon({
  size = 18,
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
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   CLOSE ICON
============================================================ */

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
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

/* ============================================================
   SPINNER
============================================================ */

function Spinner() {
  return (
    <span
      className="
        block
        h-4
        w-4
        animate-spin
        rounded-full
        border-2
        border-slate-200
        border-t-emerald-500
      "
    />
  );
}

/* ============================================================
   MEDICINE ICON
============================================================ */

function MedicineIcon() {
  return (
    <svg
      width="18"
      height="18"
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
   CUSTOMER ICON
============================================================ */

function CustomerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.7 16.4 8 14.5 12 14.5C16 14.5 18.3 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   ORDER ICON
============================================================ */

function OrderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 12H16M8 15H13"
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
      width="18"
      height="18"
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

/* ============================================================
   PRESCRIPTION ICON
============================================================ */

function PrescriptionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3.5H14L18 7.5V20.5H6V3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.5V7.5H18"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 11H15M9 14H15M9 17H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}