"use client";

import type { ReactNode } from "react";

export type AdminCustomer = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CustomerListProps = {
  customers: AdminCustomer[];
  loading: boolean;
  onView: (customer: AdminCustomer) => void;
};

export default function CustomerList({
  customers,
  loading,
  onView,
}: CustomerListProps) {
  if (loading) {
    return <CustomerListSkeleton />;
  }

  if (!customers.length) {
    return <CustomerEmptyState />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
      {/* =====================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Email
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Role
              </th>

              <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Joined
              </th>

              <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <CustomerTableRow
                key={customer._id}
                customer={customer}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          MOBILE CARDS
      ====================================================== */}

      <div className="grid gap-3 p-3 md:hidden">
        {customers.map((customer) => (
          <CustomerMobileCard
            key={customer._id}
            customer={customer}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function CustomerTableRow({
  customer,
  onView,
}: {
  customer: AdminCustomer;
  onView: (customer: AdminCustomer) => void;
}) {
  return (
    <tr className="border-b border-slate-100 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/70">
      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <CustomerAvatar
            name={customer.name}
          />

          <div className="min-w-0">
            <p className="max-w-[180px] truncate text-sm font-bold text-slate-900">
              {customer.name ||
                "Unnamed customer"}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              #{getShortId(customer._id)}
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-5 py-4">
        <p className="max-w-[240px] truncate text-sm font-medium text-slate-700">
          {customer.email ||
            "No email"}
        </p>
      </td>

      {/* Role */}
      <td className="px-5 py-4">
        <RoleBadge role={customer.role} />
      </td>

      {/* Joined */}
      <td className="px-5 py-4">
        <p className="text-xs font-medium text-slate-700">
          {formatDate(
            customer.createdAt
          )}
        </p>
      </td>

      {/* Action */}
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onView(customer)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
        >
          View
        </button>
      </td>
    </tr>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function CustomerMobileCard({
  customer,
  onView,
}: {
  customer: AdminCustomer;
  onView: (customer: AdminCustomer) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CustomerAvatar
          name={customer.name}
          size="large"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {customer.name ||
                  "Unnamed customer"}
              </h3>

              <p className="mt-1 text-[10px] text-slate-400">
                #{getShortId(customer._id)}
              </p>
            </div>

            <RoleBadge role={customer.role} />
          </div>

          <p className="mt-3 break-all text-xs leading-5 text-slate-500">
            {customer.email ||
              "No email"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <span className="text-xs font-medium text-slate-500">
          Joined
        </span>

        <span className="text-xs font-semibold text-slate-700">
          {formatDate(
            customer.createdAt
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onView(customer)}
        className="mt-4 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-[0.99]"
      >
        View Customer
      </button>
    </article>
  );
}

/* ============================================================
   AVATAR
============================================================ */

function CustomerAvatar({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "large";
}) {
  const initials = getInitials(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white shadow-sm ${
        size === "large"
          ? "h-12 w-12 text-sm"
          : "h-10 w-10 text-xs"
      }`}
    >
      {initials}
    </div>
  );
}

/* ============================================================
   ROLE BADGE
============================================================ */

function RoleBadge({
  role,
}: {
  role: string;
}) {
  const normalized =
    role.toUpperCase();

  const isAdmin =
    normalized === "ADMIN";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        isAdmin
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
      }`}
    >
      {normalized || "USER"}
    </span>
  );
}

/* ============================================================
   LOADING
============================================================ */

function CustomerListSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(
          (item) => (
            <div
              key={item}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
            >
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />

                <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />

              <div className="h-9 w-16 animate-pulse rounded-xl bg-slate-100" />
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

function CustomerEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-3xl sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CustomerIcon />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
        No customers found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
        Registered customers will appear
        here.
      </p>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getInitials(
  name: string
) {
  const value = name.trim();

  if (!value) {
    return "CU";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return (
      parts[0]
        .slice(0, 2)
        .toUpperCase()
    );
  }

  return (
    `${parts[0][0]}${parts[parts.length - 1][0]}`
  ).toUpperCase();
}

function getShortId(
  id: string
) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id.slice(-8).toUpperCase()
    : id.toUpperCase();
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Unknown date";
  }

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
    }
  ).format(date);
}

/* ============================================================
   ICON
============================================================ */

function CustomerIcon(): ReactNode {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19C3.9 15.9 5.8 14.5 9 14.5C12.2 14.5 14.1 15.9 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 11.5C18 11.5 20 13.1 20.5 15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 5.5C17.2 5.5 18.5 6.7 18.5 8.3C18.5 9.3 18 10.2 17.2 10.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}