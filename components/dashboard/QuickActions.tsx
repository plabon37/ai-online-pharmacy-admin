"use client";

import { useRouter } from "next/navigation";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  className: string;
};

export default function QuickActions() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: "Manage Medicines",
      description:
        "Add, edit and manage pharmacy medicines.",
      href: "/dashboard/medicines",
      icon: <MedicineIcon />,
      className:
        "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    },

    {
      label: "Manage Customers",
      description:
        "View and manage registered customers.",
      href: "/dashboard/customers",
      icon: <UsersIcon />,
      className:
        "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
    },

    {
      label: "Manage Orders",
      description:
        "Review and process customer orders.",
      href: "/dashboard/orders",
      icon: <OrderIcon />,
      className:
        "bg-teal-50 text-teal-700 hover:bg-teal-100",
    },

    {
      label: "Prescriptions",
      description:
        "Review pending customer prescriptions.",
      href: "/dashboard/prescriptions",
      icon: <PrescriptionIcon />,
      className:
        "bg-violet-50 text-violet-700 hover:bg-violet-100",
    },

    {
      label: "Stock Alerts",
      description:
        "Check low and out-of-stock medicines.",
      href: "/dashboard/stock-alerts",
      icon: <AlertIcon />,
      className:
        "bg-amber-50 text-amber-700 hover:bg-amber-100",
    },

    {
      label: "Reports",
      description:
        "Review pharmacy performance and analytics.",
      href: "/dashboard/reports",
      icon: <ReportIcon />,
      className:
        "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Shortcuts
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Quick Actions
          </h2>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
            Access the most frequently used pharmacy
            management features quickly.
          </p>
        </div>
      </div>

      {/* =====================================================
          ACTION GRID
      ====================================================== */}

      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(
          (action) => (
            <button
              key={action.href}
              type="button"
              onClick={() =>
                router.push(
                  action.href
                )
              }
              className={`group flex min-w-0 items-start gap-3 rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5 ${action.className}`}
            >
              {/* Icon */}

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-105">
                {action.icon}
              </span>

              {/* Content */}

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold sm:text-base">
                  {action.label}
                </span>

                <span className="mt-1 block text-[11px] leading-5 opacity-70 sm:text-xs">
                  {action.description}
                </span>
              </span>

              {/* Arrow */}

              <span className="mt-1 shrink-0 opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-80">
                <ArrowIcon />
              </span>
            </button>
          )
        )}
      </div>
    </section>
  );
}

/* ============================================================
   ICONS
============================================================ */

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