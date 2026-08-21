"use client";

import {
  useState,
  type ReactNode,
} from "react";

export type AdminCustomer = {
  _id: string;

  name: string;

  email: string;

  role: string;

  /*
   * Optional here because your current parent may not
   * provide this field yet.
   *
   * When backend provides it:
   * true  = Active
   * false = Inactive
   */
  isActive?: boolean;

  createdAt:
    | string
    | null;

  updatedAt:
    | string
    | null;
};

type CustomerListProps = {
  customers: AdminCustomer[];

  loading: boolean;

  onView: (
    customer: AdminCustomer
  ) => void;
};

type StatusResponse = {
  success: boolean;

  data:
    | {
        customer?: {
          id: string;
          isActive: boolean;
        };
      }
    | null;

  message: string;
};

export default function CustomerList({
  customers,
  loading,
  onView,
}: CustomerListProps) {
  /*
   * Keep local customer state so status can update
   * immediately after Activate / Deactivate.
   */
  const [
    localCustomers,
    setLocalCustomers,
  ] =
    useState<
      AdminCustomer[]
    >(customers);

  /*
   * Keep local data synchronized with the parent
   * whenever the parent gives us new customers.
   *
   * We intentionally do this without useEffect.
   *
   * The component derives the working list from parent
   * data first, while status changes are handled locally.
   *
   * For the initial render, use the latest parent array
   * when lengths/IDs differ.
   */

  const customerSource =
    localCustomers.length ===
      customers.length &&
    localCustomers.every(
      (
        localCustomer,
        index
      ) =>
        localCustomer._id ===
        customers[index]?._id
    )
      ? localCustomers
      : customers;

  if (loading) {
    return (
      <CustomerListSkeleton />
    );
  }

  if (
    !customerSource.length
  ) {
    return (
      <CustomerEmptyState />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">

      {/* =====================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1050px] border-collapse">

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
                Status
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
            {customerSource.map(
              (
                customer
              ) => (
                <CustomerTableRow
                  key={
                    customer._id
                  }
                  customer={
                    customer
                  }
                  onView={
                    onView
                  }
                  onToggleStatus={
                    async (
                      target
                    ) => {
                      await handleToggleCustomerStatus(
                        target,
                        setLocalCustomers
                      );
                    }
                  }
                  loadingId={
                    null
                  }
                />
              )
            )}
          </tbody>

        </table>
      </div>

      {/* =====================================================
          MOBILE
      ====================================================== */}

      <div className="grid gap-3 p-3 md:hidden">
        {customerSource.map(
          (
            customer
          ) => (
            <CustomerMobileCard
              key={
                customer._id
              }
              customer={
                customer
              }
              onView={
                onView
              }
              onToggleStatus={
                async (
                  target
                ) => {
                  await handleToggleCustomerStatus(
                    target,
                    setLocalCustomers
                  );
                }
              }
              loadingId={
                null
              }
            />
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TOGGLE STATUS
============================================================ */

async function handleToggleCustomerStatus(
  customer: AdminCustomer,
  setCustomers: React.Dispatch<
    React.SetStateAction<
      AdminCustomer[]
    >
  >
) {
  const currentStatus =
    customer.isActive !== false;

  const nextStatus =
    !currentStatus;

  const actionText =
    nextStatus
      ? "activate"
      : "deactivate";

  const confirmed =
    window.confirm(
      nextStatus
        ? `Activate ${customer.name}'s account?`
        : `Deactivate ${customer.name}'s account?`
    );

  if (!confirmed) {
    return;
  }

  try {
    /* ========================================================
       SAME-ORIGIN API

       The customer status route is inside this same
       Next.js application, so do NOT use
       NEXT_PUBLIC_API_URL here.
    ======================================================== */

    const response =
      await fetch(
        `/api/customers/${encodeURIComponent(
          customer._id
        )}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          credentials:
            "include",

          cache:
            "no-store",

          body:
            JSON.stringify({
              isActive:
                nextStatus,
            }),
        }
      );

    /* ========================================================
       READ RESPONSE
    ======================================================== */

    const responseText =
      await response.text();

    let result:
      | StatusResponse
      | null = null;

    try {
      result =
        responseText
          ? (JSON.parse(
              responseText
            ) as StatusResponse)
          : null;
    } catch {
      console.error(
        "Customer status API returned non-JSON response:",
        {
          status:
            response.status,

          response:
            responseText.slice(
              0,
              1000
            ),
        }
      );

      throw new Error(
        `Customer status API returned an invalid response (${response.status}).`
      );
    }

    /* ========================================================
       UNAUTHORIZED
    ======================================================== */

    if (
      response.status ===
      401
    ) {
      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    /* ========================================================
       FORBIDDEN
    ======================================================== */

    if (
      response.status ===
      403
    ) {
      throw new Error(
        result?.message ||
          "Admin access required."
      );
    }

    /* ========================================================
       OTHER API ERROR
    ======================================================== */

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          `Unable to ${actionText} customer (${response.status}).`
      );
    }

    /* ========================================================
       UPDATED STATUS
    ======================================================== */

    const updatedStatus =
      result.data?.customer
        ?.isActive ??
      nextStatus;

    /* ========================================================
       UPDATE LOCAL LIST
    ======================================================== */

    setCustomers(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item._id ===
            customer._id
              ? {
                  ...item,

                  isActive:
                    updatedStatus,
                }
              : item
        )
    );

    /* ========================================================
       SUCCESS MESSAGE
    ======================================================== */

    window.alert(
      updatedStatus
        ? "Customer activated successfully."
        : "Customer deactivated successfully."
    );
  } catch (
    error
  ) {
    console.error(
      "Customer status update error:",
      error
    );

    window.alert(
      error instanceof
        Error
        ? error.message
        : `Unable to ${actionText} customer.`
    );
  }
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function CustomerTableRow({
  customer,
  onView,
  onToggleStatus,
}: {
  customer: AdminCustomer;

  onView: (
    customer: AdminCustomer
  ) => void;

  onToggleStatus: (
    customer: AdminCustomer
  ) => Promise<void>;

  loadingId:
    | string
    | null;
}) {
  const active =
    customer.isActive !==
    false;

  return (
    <tr className="border-b border-slate-100 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/70">

      {/* CUSTOMER */}

      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">

          <CustomerAvatar
            name={
              customer.name
            }
          />

          <div className="min-w-0">

            <p className="max-w-[180px] truncate text-sm font-bold text-slate-900">
              {customer.name ||
                "Unnamed customer"}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              #
              {getShortId(
                customer._id
              )}
            </p>

          </div>

        </div>
      </td>

      {/* EMAIL */}

      <td className="px-5 py-4">
        <p className="max-w-[240px] truncate text-sm font-medium text-slate-700">
          {customer.email ||
            "No email"}
        </p>
      </td>

      {/* ROLE */}

      <td className="px-5 py-4">
        <RoleBadge
          role={
            customer.role
          }
        />
      </td>

      {/* STATUS */}

      <td className="px-5 py-4">
        <StatusBadge
          isActive={
            active
          }
        />
      </td>

      {/* JOINED */}

      <td className="px-5 py-4">
        <p className="text-xs font-medium text-slate-700">
          {formatDate(
            customer.createdAt
          )}
        </p>
      </td>

      {/* ACTION */}

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={() =>
              onView(
                customer
              )
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
          >
            View
          </button>

          <button
            type="button"
            onClick={() =>
              void onToggleStatus(
                customer
              )
            }
            className={`min-w-[100px] rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95 ${
              active
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {active
              ? "Deactivate"
              : "Activate"}
          </button>

        </div>
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
  onToggleStatus,
}: {
  customer: AdminCustomer;

  onView: (
    customer: AdminCustomer
  ) => void;

  onToggleStatus: (
    customer: AdminCustomer
  ) => Promise<void>;

  loadingId:
    | string
    | null;
}) {
  const active =
    customer.isActive !==
    false;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start gap-3">

        <CustomerAvatar
          name={
            customer.name
          }
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
                #
                {getShortId(
                  customer._id
                )}
              </p>

            </div>

            <RoleBadge
              role={
                customer.role
              }
            />

          </div>

          <p className="mt-3 break-all text-xs leading-5 text-slate-500">
            {customer.email ||
              "No email"}
          </p>

        </div>

      </div>

      {/* STATUS */}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">

        <span className="text-xs font-medium text-slate-500">
          Account Status
        </span>

        <StatusBadge
          isActive={
            active
          }
        />

      </div>

      {/* JOINED */}

      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">

        <span className="text-xs font-medium text-slate-500">
          Joined
        </span>

        <span className="text-xs font-semibold text-slate-700">
          {formatDate(
            customer.createdAt
          )}
        </span>

      </div>

      {/* ACTIONS */}

      <div className="mt-4 grid grid-cols-2 gap-2">

        <button
          type="button"
          onClick={() =>
            onView(
              customer
            )
          }
          className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.99]"
        >
          View Customer
        </button>

        <button
          type="button"
          onClick={() =>
            void onToggleStatus(
              customer
            )
          }
          className={`h-10 rounded-xl border text-xs font-semibold transition active:scale-[0.99] ${
            active
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {active
            ? "Deactivate"
            : "Activate"}
        </button>

      </div>

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

  size?:
    | "normal"
    | "large";
}) {
  const initials =
    getInitials(name);

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
    normalized ===
    "ADMIN";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        isAdmin
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
      }`}
    >
      {normalized ||
        "USER"}
    </span>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  isActive,
}: {
  isActive: boolean;
}) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

      Inactive
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

        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (item) => (
            <div
              key={
                item
              }
              className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
            >
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />

                <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />

              <div className="h-9 w-16 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
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
        Registered customers will appear here.
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
  const value =
    name.trim();

  if (!value) {
    return "CU";
  }

  const parts =
    value
      .split(/\s+/)
      .filter(
        Boolean
      );

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    `${parts[0][0]}${
      parts[
        parts.length - 1
      ][0]
    }`
  ).toUpperCase();
}

function getShortId(
  id: string
) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length >
    8
    ? id
        .slice(-8)
        .toUpperCase()
    : id.toUpperCase();
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Unknown date";
  }

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