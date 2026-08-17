"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminProfile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminProfileResponse = {
  success: boolean;
  data: AdminProfile | null;
  message: string;
};

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<AdminProfile | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD PROFILE
  ========================================================== */

  const loadProfile = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/admin/profile",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        console.error(
          "Admin profile returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Profile API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as AdminProfileResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load admin profile"
        );
      }

      if (!result.data) {
        throw new Error(
          "Admin profile data unavailable"
        );
      }

      setProfile(result.data);
      setLoaded(true);
    } catch (error) {
      console.error(
        "Admin profile error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load admin profile"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  if (
    !loaded &&
    !loading &&
    !error
  ) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-5 sm:space-y-6">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeftIcon />
          Back to Dashboard
        </button>

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm sm:h-20 sm:w-20">
              <UserIcon large />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
              Administrator
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Profile
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-emerald-50 sm:text-sm">
              View your authenticated administrator
              account information and security details.
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              <EyeIcon />
              View Profile
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error &&
    !profile
  ) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeftIcon />
          Back to Dashboard
        </button>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:rounded-3xl sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
            <AlertIcon />
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
            Unable to load profile
          </h2>

          <p className="mx-auto mt-2 max-w-lg break-words text-xs leading-5 text-red-600 sm:text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={loadProfile}
            className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading &&
    !profile
  ) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return null;
  }

  /* ==========================================================
     PROFILE
  ========================================================== */

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 sm:space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() =>
          router.push("/dashboard")
        }
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ArrowLeftIcon />
        Back to Dashboard
      </button>

      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-white/10 blur-3xl sm:h-48 sm:w-48" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur-sm sm:h-20 sm:w-20 sm:text-xl">
              {getInitials(
                profile.name
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
                Administrator
              </p>

              <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl lg:text-3xl">
                {profile.name ||
                  "Administrator"}
              </h1>

              <p className="mt-1 break-all text-xs text-emerald-50 sm:text-sm">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
            {profile.role}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Access Level"
          value={profile.role}
          description="Current administrator role"
          className="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Account Status"
          value="Active"
          description="Authenticated account"
          className="bg-cyan-50 text-cyan-700"
        />

        <SummaryCard
          label="Member Since"
          value={formatDate(
            profile.createdAt
          )}
          description="Account creation date"
          className="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Account Details */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Account
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Account Information
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Current authenticated administrator details.
            </p>
          </div>

          <span className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
            Active
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6">
          <InfoRow
            label="Name"
            value={
              profile.name ||
              "Not available"
            }
          />

          <InfoRow
            label="Email"
            value={
              profile.email ||
              "Not available"
            }
          />

          <InfoRow
            label="Role"
            value={
              profile.role ||
              "ADMIN"
            }
          />

          <InfoRow
            label="Admin ID"
            value={profile._id}
          />

          <InfoRow
            label="Account Created"
            value={formatDateTime(
              profile.createdAt
            )}
          />

          <InfoRow
            label="Last Updated"
            value={formatDateTime(
              profile.updatedAt
            )}
          />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
          Security
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
          Account Security
        </h2>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
          Keep your administrator account secure by
          regularly updating your password.
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              Password
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Update your administrator password from
              Settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/settings"
              )
            }
            className="flex h-10 w-full shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:w-auto"
          >
            Security Settings
          </button>
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words text-xs leading-5 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadProfile}
            className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY
============================================================ */

function SummaryCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: string;
  description: string;
  className: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl p-4 shadow-sm sm:p-5 ${className}`}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70 sm:text-xs">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 truncate text-[11px] opacity-70 sm:text-xs">
        {description}
      </p>
    </div>
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
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-slate-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <span className="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">
        {label}
      </span>

      <span className="min-w-0 break-all text-xs font-semibold text-slate-800 sm:max-w-[70%] sm:text-right sm:text-sm">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 sm:space-y-6">
      <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />

      <div className="rounded-2xl bg-slate-100 p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200" />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

            <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />

            <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-100 p-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-7 w-28 animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          )
        )}
      </div>

      <div className="h-96 animate-pulse rounded-2xl bg-slate-100 sm:rounded-3xl" />
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
    return "SP";
  }

  const parts =
    value
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    `${parts[0][0]}${parts[parts.length - 1][0]}`
  ).toUpperCase();
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
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

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

/* ============================================================
   ICONS
============================================================ */

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 30 : 20;

  return (
    <svg
      width={size}
      height={size}
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
        d="M5 20C5.6 16.4 8 14.5 12 14.5C16 14.5 18.4 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12C5.5 7.5 8.5 5.5 12 5.5C15.5 5.5 18.5 7.5 21 12C18.5 16.5 15.5 18.5 12 18.5C8.5 18.5 5.5 16.5 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
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