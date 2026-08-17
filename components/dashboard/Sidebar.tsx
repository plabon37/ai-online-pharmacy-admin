"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function Sidebar({
  isOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    },
    {
      label: "Prescriptions",
      href: "/dashboard/prescriptions",
      icon: <PrescriptionIcon />,
    },
    {
      label: "Stock Alerts",
      href: "/dashboard/stock-alerts",
      icon: <AlertIcon />,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <ReportIcon />,
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);

    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Logout failed");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Admin logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col
          border-r border-slate-200/80 bg-white
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
        {/* ==================================================
            BRAND
        ================================================== */}
        <div className="flex h-[84px] items-center border-b border-slate-100 px-5">
          <button
            type="button"
            onClick={() => handleNavigation("/dashboard")}
            className="group flex items-center gap-3 text-left"
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

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    group relative flex w-full items-center gap-3
                    rounded-xl px-3.5 py-3
                    text-left text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  {/* Active indicator */}
                  <span
                    className={`
                      absolute left-0 top-1/2 h-6 w-1
                      -translate-y-1/2 rounded-r-full
                      bg-gradient-to-b from-emerald-500 to-teal-500
                      transition-all duration-200
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
                      flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm"
                      }
                    `}
                  >
                    {item.icon}
                  </span>

                  <span className="truncate">{item.label}</span>

                  {/* Active arrow */}
                  <span
                    className={`
                      ml-auto transition-all duration-200
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
            })}
          </nav>
        </div>

        {/* ==================================================
            ADMIN PROFILE
        ================================================== */}
        <div className="border-t border-slate-100 p-4">
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

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-red-100 group-hover:text-red-500">
              {isLoggingOut ? (
                <SpinnerIcon />
              ) : (
                <LogoutIcon />
              )}
            </span>

            <span>
              {isLoggingOut ? "Signing out..." : "Sign Out"}
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

      <circle cx="12" cy="16" r="1" fill="currentColor" />
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