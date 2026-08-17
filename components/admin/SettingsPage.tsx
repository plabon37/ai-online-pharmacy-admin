"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type AdminProfile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type ProfileResponse = {
  success: boolean;
  data: AdminProfile | null;
  message: string;
};

type PasswordResponse = {
  success: boolean;
  data: null;
  message: string;
};

export default function SettingsPage() {
  const router = useRouter();

  /* ==========================================================
     PROFILE
  ========================================================== */

  const [profile, setProfile] =
    useState<AdminProfile | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileLoaded, setProfileLoaded] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  /* ==========================================================
     PASSWORD
  ========================================================== */

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* ==========================================================
     LOAD PROFILE
  ========================================================== */

  const loadProfile = async () => {
    if (profileLoading) {
      return;
    }

    setProfileLoading(true);
    setProfileError("");

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
          "Profile API returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Profile API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as ProfileResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load profile"
        );
      }

      if (!result.data) {
        throw new Error(
          "Profile data unavailable"
        );
      }

      setProfile(result.data);
      setProfileLoaded(true);
    } catch (error) {
      console.error(
        "Load admin profile error:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to load admin profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (passwordLoading) {
      return;
    }

    setPasswordMessage("");
    setPasswordError("");

    const current =
      currentPassword.trim();

    const next =
      newPassword.trim();

    const confirmation =
      confirmPassword.trim();

    /* ========================================================
       CLIENT VALIDATION
    ======================================================== */

    if (
      !current ||
      !next ||
      !confirmation
    ) {
      setPasswordError(
        "All password fields are required."
      );

      return;
    }

    if (next.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters long."
      );

      return;
    }

    if (next !== confirmation) {
      setPasswordError(
        "New password and confirm password do not match."
      );

      return;
    }

    if (current === next) {
      setPasswordError(
        "New password must be different from current password."
      );

      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(
        "/api/admin/change-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            currentPassword:
              current,

            newPassword:
              next,

            confirmPassword:
              confirmation,
          }),
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
          "Change password returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Password API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as PasswordResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to change password"
        );
      }

      setPasswordMessage(
        result.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  if (
    !profileLoaded &&
    !profileLoading &&
    !profileError
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

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-center text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm sm:h-20 sm:w-20">
              <SettingsIcon large />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-emerald-50 sm:text-sm">
              Manage your administrator account and
              password security.
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              <EyeIcon />
              Open Settings
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
    profileError &&
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
            Unable to load settings
          </h2>

          <p className="mx-auto mt-2 max-w-lg break-words text-xs leading-5 text-red-600 sm:text-sm">
            {profileError}
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
    profileLoading &&
    !profile
  ) {
    return <SettingsSkeleton />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 sm:space-y-6">
      {/* =====================================================
          BACK
      ====================================================== */}

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

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-white/10 blur-3xl sm:h-48 sm:w-48" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm sm:h-20 sm:w-20">
              <SettingsIcon large />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
                Administration
              </p>

              <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl lg:text-3xl">
                Settings
              </h1>

              <p className="mt-1 break-all text-xs text-emerald-50 sm:text-sm">
                {profile.email}
              </p>
            </div>
          </div>

          <span className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-200" />
            {profile.role}
          </span>
        </div>
      </section>

      {/* =====================================================
          ACCOUNT
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Account
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Account Information
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Your current administrator account information.
          </p>
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

      {/* =====================================================
          CHANGE PASSWORD
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Security
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Change Password
          </h2>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
            Update your administrator password. Your
            current password is required before the new
            password can be saved.
          </p>
        </div>

        {/* Success */}
        {passwordMessage && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
          >
            <div className="mt-0.5 shrink-0 text-emerald-600">
              <CheckIcon />
            </div>

            <p className="text-xs leading-5 text-emerald-700 sm:text-sm">
              {passwordMessage}
            </p>
          </div>
        )}

        {/* Error */}
        {passwordError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <div className="mt-0.5 shrink-0 text-red-500">
              <AlertIcon />
            </div>

            <p className="break-words text-xs leading-5 text-red-600 sm:text-sm">
              {passwordError}
            </p>
          </div>
        )}

        <form
          onSubmit={
            handleChangePassword
          }
          className="mt-5 space-y-4 sm:mt-6"
        >
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={
              showCurrentPassword
            }
            onToggle={() =>
              setShowCurrentPassword(
                (value) => !value
              )
            }
            disabled={
              passwordLoading
            }
            autoComplete="current-password"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggle={() =>
                setShowNewPassword(
                  (value) => !value
                )
              }
              disabled={
                passwordLoading
              }
              autoComplete="new-password"
            />

            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={
                setConfirmPassword
              }
              show={
                showConfirmPassword
              }
              onToggle={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              disabled={
                passwordLoading
              }
              autoComplete="new-password"
            />
          </div>

          {/* Password Requirements */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Password requirements
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Requirement
                valid={
                  newPassword.length >=
                  8
                }
                text="At least 8 characters"
              />

              <Requirement
                valid={
                  newPassword.length >
                    0 &&
                  newPassword ===
                    confirmPassword
                }
                text="Passwords match"
              />

              <Requirement
                valid={
                  currentPassword.length >
                    0 &&
                  currentPassword !==
                    newPassword
                }
                text="Different from current"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError("");
                setPasswordMessage("");
              }}
              disabled={
                passwordLoading
              }
              className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={
                passwordLoading
              }
              className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-xs font-semibold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Updating...
                </>
              ) : (
                <>
                  <LockIcon />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          SECURITY STATUS
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
          Security Status
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
          Account Security
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SecurityCard
            icon={
              <LockIcon />
            }
            title="Password Protected"
            description="Administrator password is securely stored."
          />

          <SecurityCard
            icon={
              <ShieldIcon />
            }
            title="Admin Access"
            description="This account has administrator-level permissions."
          />

          <SecurityCard
            icon={
              <CheckIcon />
            }
            title="Account Active"
            description="Your administrator account is currently active."
          />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   PASSWORD FIELD
============================================================ */

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <LockIcon />
        </div>

        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          disabled={disabled}
          autoComplete={
            autoComplete
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            show
              ? `Hide ${label}`
              : `Show ${label}`
          }
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
        >
          {show ? (
            <EyeOffIcon />
          ) : (
            <EyeIcon />
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   REQUIREMENT
============================================================ */

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        {valid ? (
          <CheckIcon small />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>

      <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
        {text}
      </span>
    </div>
  );
}

/* ============================================================
   SECURITY CARD
============================================================ */

function SecurityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
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

function SettingsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 sm:space-y-6">
      <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />

      <div className="rounded-2xl bg-slate-100 p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200" />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />

            <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="h-56 animate-pulse rounded-2xl bg-slate-100 sm:rounded-3xl" />

      <div className="h-96 animate-pulse rounded-2xl bg-slate-100 sm:rounded-3xl" />
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

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

function SettingsIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 30 : 18;

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
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19.4 15A7.8 7.8 0 0 0 20 12A7.8 7.8 0 0 0 19.4 9L21 7L19 4L16.6 5.2C15.9 4.7 15.1 4.4 14.3 4.2L14 1H10L9.7 4.2C8.9 4.4 8.1 4.7 7.4 5.2L5 4L3 7L4.6 9C4.2 9.9 4 10.9 4 12C4 13.1 4.2 14.1 4.6 15L3 17L5 20L7.4 18.8C8.1 19.3 8.9 19.6 9.7 19.8L10 23H14L14.3 19.8C15.1 19.6 15.9 19.3 16.6 18.8L19 20L21 17L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
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

function EyeOffIcon() {
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

      <path
        d="M4 4L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <svg
      width={small ? "12" : "18"}
      height={small ? "12" : "18"}
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

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L20 6V11C20 16 16.8 19.6 12 21C7.2 19.6 4 16 4 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 12L10.8 14.3L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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