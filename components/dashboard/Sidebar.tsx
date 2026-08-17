"use client";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useState } from "react";

type NotificationCounts = {
  outOfStock: number;
  lowStock: number;
  pendingOrders: number;
  pendingPrescriptions: number;
  totalNotifications: number;
};

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;

  notificationCounts?: NotificationCounts | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  notificationKey?:
    | "outOfStock"
    | "lowStock"
    | "pendingOrders"
    | "pendingPrescriptions";
};

export default function Sidebar({
  isOpen = true,
  onClose,
  notificationCounts = null,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const navigationItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <DashboardIcon />,
    },

    {
      label: "Medicines",
      href: "/dashboard/medicines",
      icon: <MedicineIcon />,
      notificationKey: "outOfStock",
    },

    {
      label: "Categories",
      href: "/dashboard/categories",
      icon: <CategoryIcon />,
    },

    {
      label: "Customers",
      href: "/dashboard/customers",
      icon: <UsersIcon />,
    },

    {
      label: "Orders",
      href: "/dashboard/orders",
      icon: <OrderIcon />,
      notificationKey:
        "pendingOrders",
    },

    {
      label: "Prescriptions",
      href: "/dashboard/prescriptions",
      icon: <PrescriptionIcon />,
      notificationKey:
        "pendingPrescriptions",
    },

    {
      label: "Stock Alerts",
      href: "/dashboard/stock-alerts",
      icon: <AlertIcon />,
      notificationKey: "lowStock",
    },

    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <ReportIcon />,
    },
  ];

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const handleNavigation = (
    href: string
  ) => {
    router.push(href);

    onClose?.();
  };

  /* ==========================================================
     NOTIFICATION COUNT
  ========================================================== */

  const getNotificationCount = (
    item: NavItem
  ) => {
    if (
      !notificationCounts ||
      !item.notificationKey
    ) {
      return 0;
    }

    return Number(
      notificationCounts[
        item.notificationKey
      ] || 0
    );
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/admin/logout",
        {
          method: "POST",
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
          "Logout API returned non-JSON:",
          text.slice(0, 500)
        );

        throw new Error(
          `Logout request failed with status ${response.status}`
        );
      }

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Logout failed"
        );
      }

      onClose?.();

      router.replace("/");

      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );

      setIsLoggingOut(false);
    }
  };

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isRouteActive = (
    href: string
  ) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[280px] flex-col
          border-r border-slate-200/80
          bg-white
          shadow-[8px_0_30px_rgba(15,23,42,0.05)]
          transition-transform duration-300 ease-out
          md:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ====================================================
            BRAND
        ===================================================== */}

        <div className="flex h-[84px] shrink-0 items-center border-b border-slate-100 px-5">
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "/dashboard"
              )
            }
            className="group flex min-w-0 items-center gap-3 text-left"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-200/60 transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-white/10" />

              <MedicalLogoIcon />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                Smart Pharmacy
              </p>

              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-600">
                Admin Panel
              </p>
            </div>
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ====================================================
            SCROLLABLE CONTENT
        ===================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Main Menu
          </p>

          {/* ==================================================
              MAIN NAVIGATION
          =================================================== */}

          <nav
            className="space-y-1.5"
            aria-label="Main navigation"
          >
            {navigationItems.map(
              (item) => {
                const isActive =
                  isRouteActive(
                    item.href
                  );

                const notificationCount =
                  getNotificationCount(
                    item
                  );

                const hasNotification =
                  notificationCount >
                  0;

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        item.href
                      )
                    }
                    className={`
                      group relative flex w-full items-center
                      gap-3 rounded-xl px-3.5 py-3
                      text-left text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    {/* Active bar */}
                    <span
                      className={`
                        absolute left-0 top-1/2 h-6 w-1
                        -translate-y-1/2 rounded-r-full
                        bg-gradient-to-b from-emerald-500 to-teal-500
                        transition-opacity duration-200
                        ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0"
                        }
                      `}
                    />

                    {/* Icon */}
                    <span
                      className={`
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {/* Notification badge */}
                    {hasNotification && (
                      <span
                        className={`
                          flex h-5 min-w-5 shrink-0
                          items-center justify-center
                          rounded-full px-1.5
                          text-[9px] font-bold
                          leading-none
                          ${
                            isActive
                              ? "bg-emerald-500 text-white"
                              : "bg-red-500 text-white shadow-sm"
                          }
                        `}
                      >
                        {notificationCount >
                        99
                          ? "99+"
                          : notificationCount}
                      </span>
                    )}

                    {/* Active arrow */}
                    <span
                      className={`
                        shrink-0
                        transition-all duration-200
                        ${
                          isActive
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-1 opacity-0"
                        }
                      `}
                    >
                      <ChevronRightIcon />
                    </span>
                  </button>
                );
              }
            )}
          </nav>

          {/* ==================================================
              ATTENTION SUMMARY
          =================================================== */}

          {notificationCounts &&
            notificationCounts.totalNotifications >
              0 && (
              <div className="mt-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
                    <WarningSmallIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-800">
                      Attention needed
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-amber-700/70">
                      {`${notificationCounts.totalNotifications} ${
                        notificationCounts.totalNotifications ===
                        1
                          ? "item requires"
                          : "items require"
                      } review.`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {notificationCounts.pendingOrders >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          "/dashboard/orders?status=PENDING"
                        )
                      }
                      className="rounded-lg bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-amber-100"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        Orders
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {
                          notificationCounts.pendingOrders
                        }
                      </p>
                    </button>
                  )}

                  {notificationCounts.pendingPrescriptions >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          "/dashboard/prescriptions?status=PENDING"
                        )
                      }
                      className="rounded-lg bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-amber-100"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        Prescriptions
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {
                          notificationCounts.pendingPrescriptions
                        }
                      </p>
                    </button>
                  )}

                  {notificationCounts.lowStock >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          "/dashboard/stock-alerts"
                        )
                      }
                      className="rounded-lg bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-amber-100"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        Low Stock
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {
                          notificationCounts.lowStock
                        }
                      </p>
                    </button>
                  )}

                  {notificationCounts.outOfStock >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          "/dashboard/medicines"
                        )
                      }
                      className="rounded-lg bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-amber-100"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        Out Stock
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {
                          notificationCounts.outOfStock
                        }
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* ====================================================
            BOTTOM ADMIN SECTION
        ===================================================== */}

        <div className="shrink-0 border-t border-slate-100 bg-white p-4">
          {/* Admin card */}
          <div className="mb-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
                SP
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  Smart Pharmacy
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  Administrator
                </p>
              </div>

              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            </div>
          </div>

          {/* Profile */}
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "/dashboard/profile"
              )
            }
            className={`
              group flex w-full items-center gap-3
              rounded-xl px-3.5 py-3
              text-sm font-medium
              transition-all duration-200
              ${
                pathname ===
                "/dashboard/profile"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <span
              className={`
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg transition-colors
                ${
                  pathname ===
                  "/dashboard/profile"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm"
                }
              `}
            >
              <UserIcon />
            </span>

            <span className="flex-1 text-left">
              Profile
            </span>

            {pathname ===
              "/dashboard/profile" && (
              <ChevronRightIcon />
            )}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "/dashboard/settings"
              )
            }
            className={`
              group mt-1 flex w-full items-center gap-3
              rounded-xl px-3.5 py-3
              text-sm font-medium
              transition-all duration-200
              ${
                pathname ===
                "/dashboard/settings"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <span
              className={`
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg transition-colors
                ${
                  pathname ===
                  "/dashboard/settings"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm"
                }
              `}
            >
              <SettingsIcon />
            </span>

            <span className="flex-1 text-left">
              Settings
            </span>

            {pathname ===
              "/dashboard/settings" && (
              <ChevronRightIcon />
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              isLoggingOut
            }
            className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-red-100 group-hover:text-red-500">
              {isLoggingOut ? (
                <SpinnerIcon />
              ) : (
                <LogoutIcon />
              )}
            </span>

            <span>
              {isLoggingOut
                ? "Signing out..."
                : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ============================================================
   ICONS
============================================================ */

function MedicalLogoIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        stroke="white"
        strokeWidth="1.8"
      />

      <path
        d="M12 8V16M8 12H16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MedicineIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 3.5H16.5C17.6 3.5 18.5 4.4 18.5 5.5V18.5C18.5 19.6 17.6 20.5 16.5 20.5H7.5C6.4 20.5 5.5 19.6 5.5 18.5V5.5C5.5 4.4 6.4 3.5 7.5 3.5Z"
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
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function ReportIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 20V10M10 20V5M15 20V12M20 20V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M3 20H22"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M14 8L18 12L14 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18 12H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M20 12C20 7.58 16.42 4 12 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningSmallIcon() {
  return (
    <svg
      width="17"
      height="17"
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
        d="M19.4 15A7.8 7.8 0 0 0 20 12A7.8 7.8 0 0 0 19.4 9L21 7L19 4L16.6 5.2C15.9 4.7 15.1 4.4 14.3 4.2L14 1H10L9.7 4.2C8.9 4.4 8.1 4.7 7.4 5.2L5 4L3 7L4.6 9C4.2 9.9 4 10.9 4.6 15L3 17L5 20L7.4 18.8C8.1 19.3 8.9 19.6 9.7 19.8L10 23H14L14.3 19.8C15.1 19.6 15.9 19.3 16.6 18.8L19 20L21 17L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}