"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import StockAlertNotice from "@/components/dashboard/StockAlertNotice";
import OrderStats from "@/components/dashboard/OrderStats";
import PrescriptionStats from "@/components/dashboard/PrescriptionStats";
import RecentOrders from "@/components/dashboard/RecentOrders";

type DashboardStats = {
  totalMedicines: number;
  totalCustomers: number;
  totalOrders: number;
  lowStockMedicines: number;
  outOfStockMedicines: number;
  pendingOrders: number;
  totalRevenue: number;
};

type DashboardStatsResponse = {
  success: boolean;
  data: {
    stats: DashboardStats;
  } | null;
  message: string;
};

type DashboardOverviewProps = {
  admin: {
    userId: string;
    email: string;
    role: "ADMIN";
  };
};

const defaultStats: DashboardStats = {
  totalMedicines: 0,
  totalCustomers: 0,
  totalOrders: 0,
  lowStockMedicines: 0,
  outOfStockMedicines: 0,
  pendingOrders: 0,
  totalRevenue: 0,
};

export default function DashboardOverview({
  admin,
}: DashboardOverviewProps) {
  const router = useRouter();

  const [stats, setStats] =
    useState<DashboardStats>(
      defaultStats
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD REAL DASHBOARD STATISTICS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard/stats",
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
            "Dashboard stats returned non-JSON:",
            text.slice(0, 500)
          );

          throw new Error(
            `Dashboard stats API returned ${response.status}`
          );
        }

        const result =
          (await response.json()) as DashboardStatsResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Failed to load dashboard statistics"
          );
        }

        if (mounted) {
          const apiStats =
            result.data.stats;

          setStats({
            totalMedicines:
              Number(
                apiStats?.totalMedicines ??
                  0
              ),

            totalCustomers:
              Number(
                apiStats?.totalCustomers ??
                  0
              ),

            totalOrders:
              Number(
                apiStats?.totalOrders ??
                  0
              ),

            lowStockMedicines:
              Number(
                apiStats?.lowStockMedicines ??
                  0
              ),

            outOfStockMedicines:
              Number(
                apiStats?.outOfStockMedicines ??
                  0
              ),

            pendingOrders:
              Number(
                apiStats?.pendingOrders ??
                  0
              ),

            totalRevenue:
              Number(
                apiStats?.totalRevenue ??
                  0
              ),
          });
        }
      } catch (error) {
        console.error(
          "Dashboard stats error:",
          error
        );

        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard statistics"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     DASHBOARD STAT CARDS
  ========================================================== */

  const statCards = [
    {
      label: "Role",
      value: admin.role,
      description:
        "Current access level",
      accent: "bg-emerald-500",
      loading: false,
    },

    {
      label: "Authentication",
      value: "Active",
      description:
        "Admin session is secure",
      accent: "bg-cyan-500",
      loading: false,
    },

    {
      label: "Medicines",
      value:
        stats.totalMedicines,
      description:
        stats.outOfStockMedicines >
        0
          ? `${stats.outOfStockMedicines} out of stock`
          : stats.lowStockMedicines >
            0
          ? `${stats.lowStockMedicines} low stock`
          : "Inventory is healthy",
      accent: "bg-teal-500",
      loading,
    },

    {
      label: "Orders",
      value:
        stats.totalOrders,
      description:
        stats.pendingOrders > 0
          ? `${stats.pendingOrders} pending orders`
          : "No pending orders",
      accent: "bg-blue-500",
      loading,
    },
  ];

  /* ==========================================================
     REVENUE
  ========================================================== */

  const revenueText =
    `৳${stats.totalRevenue.toLocaleString(
      "en-BD",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* =====================================================
          WELCOME HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/70 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl sm:h-52 sm:w-52" />

        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl sm:h-44 sm:w-44" />

        <div className="pointer-events-none absolute -bottom-20 -right-10 h-36 w-36 rounded-full border border-white/10 sm:h-48 sm:w-48" />

        <div className="pointer-events-none absolute right-[20%] top-[30%] h-20 w-20 rounded-full border border-white/10 sm:h-28 sm:w-28" />

        <div className="relative z-10">
          <div className="inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-200" />

            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50 sm:text-xs">
              Admin Dashboard
            </p>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Welcome back, Admin
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base sm:leading-7">
            Manage medicines, orders,
            customers, prescriptions and
            pharmacy operations from one
            place.
          </p>

          <div className="mt-5 flex max-w-full items-center sm:mt-6">
            <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <UserIcon />
              </span>

              <span className="min-w-0 truncate text-xs font-medium text-white sm:text-sm">
                {admin.email}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <section
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="break-words text-xs leading-5 text-red-600 sm:text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            Retry
          </button>
        </section>
      )}

      {/* =====================================================
          MAIN STAT CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {statCards.map(
          (stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              description={
                stat.description
              }
              accent={stat.accent}
              loading={stat.loading}
            />
          )
        )}
      </section>

      {/* =====================================================
          REVENUE / CUSTOMER SUMMARY
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Customers"
          value={
            loading
              ? "..."
              : stats.totalCustomers.toLocaleString(
                  "en-BD"
                )
          }
          description="Registered customers"
          className="bg-cyan-50 text-cyan-700"
        />

        <SummaryCard
          label="Revenue"
          value={
            loading
              ? "..."
              : revenueText
          }
          description="Total non-cancelled revenue"
          className="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Pending Orders"
          value={
            loading
              ? "..."
              : stats.pendingOrders.toLocaleString(
                  "en-BD"
                )
          }
          description="Orders waiting for processing"
          className="bg-amber-50 text-amber-700"
        />
      </section>

      {/* =====================================================
          EXISTING STOCK ALERTS
      ====================================================== */}

      <StockAlertNotice />

      {/* =====================================================
          EXISTING ORDER STATS
      ====================================================== */}

      <OrderStats />

      {/* =====================================================
          EXISTING PRESCRIPTION STATS
      ====================================================== */}

      <PrescriptionStats />

      {/* =====================================================
          RECENT ORDERS
      ====================================================== */}

      <RecentOrders />

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Shortcuts
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Quick Actions
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
              Access frequently used pharmacy
              management features quickly.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            label="Manage Medicines"
            description="Add, edit and manage pharmacy medicines."
            href="/dashboard/medicines"
            icon={
              <MedicineIcon />
            }
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          />

          <QuickAction
            label="Manage Customers"
            description="View and manage registered customers."
            href="/dashboard/customers"
            icon={
              <UsersIcon />
            }
            className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
          />

          <QuickAction
            label="Manage Orders"
            description="Review and process customer orders."
            href="/dashboard/orders"
            icon={
              <OrderIcon />
            }
            className="bg-teal-50 text-teal-700 hover:bg-teal-100"
          />

          <QuickAction
            label="Prescriptions"
            description="Review pending customer prescriptions."
            href="/dashboard/prescriptions"
            icon={
              <PrescriptionIcon />
            }
            className="bg-violet-50 text-violet-700 hover:bg-violet-100"
          />

          <QuickAction
            label="Stock Alerts"
            description="Check low and out-of-stock medicines."
            href="/dashboard/stock-alerts"
            icon={
              <AlertIcon />
            }
            className="bg-amber-50 text-amber-700 hover:bg-amber-100"
          />

          <QuickAction
            label="Reports"
            description="Review pharmacy performance and analytics."
            href="/dashboard/reports"
            icon={
              <ReportIcon />
            }
            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
          />
        </div>
      </section>

      {/* =====================================================
          ACCOUNT INFORMATION
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Administrator
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Account Information
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
              Current authenticated
              administrator details.
            </p>
          </div>

          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />

            Active
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6">
          <InfoRow
            label="Admin ID"
            value={admin.userId}
          />

          <InfoRow
            label="Email"
            value={admin.email}
          />

          <InfoRow
            label="Role"
            value={admin.role}
          />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  label,
  description,
  href,
  icon,
  className,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  className: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        router.push(href)
      }
      className={`group flex min-w-0 items-start gap-3 rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5 ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-105">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold sm:text-base">
          {label}
        </span>

        <span className="mt-1 block text-[11px] leading-5 opacity-70 sm:text-xs">
          {description}
        </span>
      </span>

      <span className="mt-1 shrink-0 opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-80">
        <ArrowIcon />
      </span>
    </button>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  description,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  description: string;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
      <span
        className={`absolute left-0 top-0 h-full w-1 ${accent}`}
      />

      <div className="min-w-0 pl-2">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </p>

        {loading ? (
          <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
        ) : (
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        )}

        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400 sm:text-xs">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
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
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70 sm:text-xs">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
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
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-slate-50 px-3.5 py-3.5 transition-colors duration-200 hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-4">
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
   ICONS
============================================================ */

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.5 19C6.1 15.9 8.2 14.5 12 14.5C15.8 14.5 17.9 15.9 18.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedicineIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function UsersIcon() {
  return (
    <svg
      width="19"
      height="19"
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

      <circle
        cx="17"
        cy="9"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 15C17.6 14.7 19.5 15.9 20 18"
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
      width="19"
      height="19"
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
      width="19"
      height="19"
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
      width="19"
      height="19"
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
      width="19"
      height="19"
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