"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DashboardNotificationCounts = {
  outOfStock: number;
  lowStock: number;
  pendingOrders: number;
  pendingPrescriptions: number;
  totalNotifications: number;
};

type NavbarProps = {
  onMenuClick?: () => void;

  onNotificationsLoaded?: (
    data: DashboardNotificationCounts
  ) => void;
};

type NotificationResponse = {
  success: boolean;

  data: {
    notifications: {
      outOfStock: number;
      lowStock: number;
      pendingOrders: number;
      pendingPrescriptions: number;
    };

    totalNotifications: number;
  } | null;

  message: string;
};

export default function Navbar({
  onMenuClick,
  onNotificationsLoaded,
}: NavbarProps) {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] =
    useState<DashboardNotificationCounts | null>(
      null
    );

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState("");

  /* ==========================================================
     NORMALIZE NOTIFICATION DATA
  ========================================================== */

  const normalizeNotifications = (
    data: NonNullable<
      NotificationResponse["data"]
    >
  ): DashboardNotificationCounts => {
    return {
      outOfStock: Number(
        data.notifications?.outOfStock ?? 0
      ),

      lowStock: Number(
        data.notifications?.lowStock ?? 0
      ),

      pendingOrders: Number(
        data.notifications?.pendingOrders ?? 0
      ),

      pendingPrescriptions: Number(
        data.notifications
          ?.pendingPrescriptions ?? 0
      ),

      totalNotifications: Number(
        data.totalNotifications ?? 0
      ),
    };
  };

  /* ==========================================================
     NOTIFICATION TOGGLE
  ========================================================== */

  const handleNotificationToggle =
    async () => {
      const nextState =
        !isNotificationOpen;

      setIsNotificationOpen(nextState);

      /*
       * Opening notification should close
       * profile dropdown.
       */
      if (nextState) {
        setIsProfileOpen(false);
      }

      if (!nextState) {
        return;
      }

      /*
       * Do not request again when data is
       * already available.
       */
      if (notifications) {
        return;
      }

      await loadNotifications();
    };

  /* ==========================================================
     LOAD NOTIFICATIONS
  ========================================================== */

  const loadNotifications = async () => {
    if (notificationLoading) {
      return;
    }

    setNotificationLoading(true);
    setNotificationError("");

    try {
      const response = await fetch(
        "/api/dashboard/notifications",
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
          "Notification API returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Notification API returned ${response.status}`
        );
      }

      const result =
        (await response.json()) as NotificationResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load notifications"
        );
      }

      if (!result.data) {
        throw new Error(
          "Notification data unavailable"
        );
      }

      const normalized =
        normalizeNotifications(
          result.data
        );

      setNotifications(
        normalized
      );

      /*
       * Share the same notification data
       * with DashboardShell -> Sidebar.
       */
      onNotificationsLoaded?.(
        normalized
      );
    } catch (error) {
      console.error(
        "Notification load error:",
        error
      );

      setNotificationError(
        error instanceof Error
          ? error.message
          : "Failed to load notifications"
      );
    } finally {
      setNotificationLoading(
        false
      );
    }
  };

  /* ==========================================================
     REFRESH NOTIFICATIONS
  ========================================================== */

  const handleRefreshNotifications =
    async () => {
      if (notificationLoading) {
        return;
      }

      setNotifications(null);

      await loadNotifications();
    };

  /* ==========================================================
     NOTIFICATION NAVIGATION
  ========================================================== */

  const handleNotificationClick = (
    path: string
  ) => {
    setIsNotificationOpen(false);

    router.push(path);
  };

  /* ==========================================================
     PROFILE DROPDOWN TOGGLE
  ========================================================== */

  const handleProfileToggle = () => {
    const nextState =
      !isProfileOpen;

    setIsProfileOpen(nextState);

    /*
     * Opening profile should close
     * notification dropdown.
     */
    if (nextState) {
      setIsNotificationOpen(false);
    }
  };

  /* ==========================================================
     PROFILE NAVIGATION
  ========================================================== */

  const handleProfileNavigation = (
    path: string
  ) => {
    setIsProfileOpen(false);

    router.push(path);
  };

  const notificationCount =
    notifications?.totalNotifications ??
    0;

  return (
    <header className="sticky top-0 z-30 h-[84px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-3 sm:px-5 lg:px-8">
        {/* ==================================================
            LEFT
        =================================================== */}

        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 md:hidden"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:block">
              Smart Pharmacy
            </p>

            <h2 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-xl">
              Administration
            </h2>
          </div>
        </div>

        {/* ==================================================
            RIGHT
        =================================================== */}

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 sm:flex"
          >
            <SearchIcon />
          </button>

          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={
                handleNotificationToggle
              }
              aria-label="Notifications"
              aria-expanded={
                isNotificationOpen
              }
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
                isNotificationOpen
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
            >
              <BellIcon />

              {notificationCount >
                0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[8px] font-bold leading-none text-white shadow-sm">
                  {notificationCount >
                  99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[calc(100vw-24px)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)] sm:w-[390px]">
                {/* Header */}
                <div className="border-b border-slate-100 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        Notifications
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        Pharmacy activity requiring attention
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleRefreshNotifications
                      }
                      disabled={
                        notificationLoading
                      }
                      aria-label="Refresh notifications"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshIcon
                        spinning={
                          notificationLoading
                        }
                      />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="max-h-[420px] overflow-y-auto">
                  {notificationLoading &&
                  !notifications ? (
                    <NotificationSkeleton />
                  ) : notificationError ? (
                    <div className="p-5 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                        <AlertIcon />
                      </div>

                      <p className="mt-3 text-xs font-semibold text-slate-700">
                        Unable to load notifications
                      </p>

                      <p className="mt-1 break-words text-[11px] leading-5 text-slate-400">
                        {notificationError}
                      </p>

                      <button
                        type="button"
                        onClick={
                          loadNotifications
                        }
                        className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : notifications ? (
                    <>
                      <NotificationItem
                        icon={
                          <AlertIcon />
                        }
                        label="Out of Stock"
                        count={
                          notifications.outOfStock
                        }
                        description="Medicines unavailable"
                        className="bg-red-50 text-red-600"
                        onClick={() =>
                          handleNotificationClick(
                            "/dashboard/medicines"
                          )
                        }
                      />

                      <NotificationItem
                        icon={
                          <WarningIcon />
                        }
                        label="Low Stock"
                        count={
                          notifications.lowStock
                        }
                        description="Medicines need restocking"
                        className="bg-amber-50 text-amber-600"
                        onClick={() =>
                          handleNotificationClick(
                            "/dashboard/stock-alerts"
                          )
                        }
                      />

                      <NotificationItem
                        icon={
                          <OrderIcon />
                        }
                        label="Pending Orders"
                        count={
                          notifications.pendingOrders
                        }
                        description="Orders awaiting confirmation"
                        className="bg-blue-50 text-blue-600"
                        onClick={() =>
                          handleNotificationClick(
                            "/dashboard/orders?status=PENDING"
                          )
                        }
                      />

                      <NotificationItem
                        icon={
                          <PrescriptionIcon />
                        }
                        label="Pending Prescriptions"
                        count={
                          notifications.pendingPrescriptions
                        }
                        description="Prescriptions waiting for review"
                        className="bg-violet-50 text-violet-600"
                        onClick={() =>
                          handleNotificationClick(
                            "/dashboard/prescriptions?status=PENDING"
                          )
                        }
                      />

                      {notificationCount ===
                        0 && (
                        <div className="p-7 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckIcon />
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            All caught up
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            There are no items requiring your attention.
                          </p>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Footer */}
                {!notificationLoading &&
                  !notificationError &&
                  notificationCount >
                    0 && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                          {`${notificationCount} ${
                            notificationCount ===
                            1
                              ? "item"
                              : "items"
                          } need attention`}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setIsNotificationOpen(
                              false
                            );

                            router.push(
                              "/dashboard"
                            );
                          }}
                          className="text-[11px] font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          Dashboard
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-0.5 hidden h-8 w-px bg-slate-200 sm:block" />

          {/* ==================================================
              PROFILE
          =================================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={
                handleProfileToggle
              }
              aria-label="Open admin profile menu"
              aria-expanded={
                isProfileOpen
              }
              className="group flex items-center gap-1.5 rounded-xl p-1.5 transition-all duration-200 hover:bg-slate-50 sm:gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                SP
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                  Smart Pharmacy
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Administrator
                </p>
              </div>

              <ChevronDownIcon />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      SP
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        Smart Pharmacy
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        Administrator
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {/* Profile */}
                  <button
                    type="button"
                    onClick={() =>
                      handleProfileNavigation(
                        "/dashboard/profile"
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <UserIcon />
                    <span>Profile</span>
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() =>
                      handleProfileNavigation(
                        "/dashboard/settings"
                      )
                    }
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   NOTIFICATION ITEM
============================================================ */

function NotificationItem({
  icon,
  label,
  count,
  description,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  description: string;
  className: string;
  onClick: () => void;
}) {
  const hasItems =
    Number(count) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasItems}
      className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
        hasItems
          ? "cursor-pointer hover:bg-slate-50"
          : "cursor-default opacity-45"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-slate-800">
            {label}
          </span>

          {hasItems && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${className}`}
            >
              {count}
            </span>
          )}
        </span>

        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
          {description}
        </span>
      </span>

      {hasItems && (
        <ArrowIcon />
      )}
    </button>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function NotificationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl p-3"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />

              <div className="h-2 w-40 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-100" />
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function MenuIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 9C18 5.7 15.3 3 12 3C8.7 3 6 5.7 6 9V13.5L4.5 16H19.5L18 13.5V9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 19C10.1 20 10.9 20.5 12 20.5C13.1 20.5 13.9 20 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon({
  spinning = false,
}: {
  spinning?: boolean;
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={
        spinning
          ? "animate-spin"
          : undefined
      }
    >
      <path
        d="M20 11A8 8 0 1 0 18 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M20 5V11H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function WarningIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L20 7V12C20 16.8 16.9 19.8 12 21C7.1 19.8 4 16.8 4 12V7L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
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

function PrescriptionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 8H16M8 11H16M8 14H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15 15.5L18 18.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="13.5"
        cy="13.5"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500"
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function SettingsIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function ChevronDownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}