type DashboardOverviewProps = {
  admin: {
    userId: string;
    email: string;
    role: "ADMIN";
  };
};

export default function DashboardOverview({
  admin,
}: DashboardOverviewProps) {
  const stats = [
    {
      label: "Role",
      value: admin.role,
      description: "Current access level",
    },
    {
      label: "Authentication",
      value: "Active",
      description: "Admin session is secure",
    },
    {
      label: "Medicines",
      value: "Ready",
      description: "Medicine management",
    },
    {
      label: "Orders",
      value: "Ready",
      description: "Order management",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      {/* =====================================================
          WELCOME HEADER
      ====================================================== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/70 sm:rounded-3xl sm:p-7 lg:p-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl sm:h-52 sm:w-52" />

        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl sm:h-44 sm:w-44" />

        <div className="pointer-events-none absolute -bottom-20 -right-10 h-36 w-36 rounded-full border border-white/10 sm:h-48 sm:w-48" />

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-200" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50 sm:text-xs">
              Admin Dashboard
            </p>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Welcome back, Admin
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base sm:leading-7">
            Manage medicines, orders, customers, prescriptions and
            pharmacy operations from one place.
          </p>

          {/* Responsive admin email */}
          <div className="mt-5 flex max-w-full items-center gap-2 sm:mt-6">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-4">
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
          STATS
      ====================================================== */}
      <section className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            index={index}
          />
        ))}
      </section>

      {/* =====================================================
          ACCOUNT INFORMATION
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Administrator
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Account Information
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Current authenticated administrator details.
            </p>
          </div>

          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
            Active
          </div>
        </div>

        {/* Information */}
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
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  description,
  index,
}: {
  label: string;
  value: string;
  description: string;
  index: number;
}) {
  const accents = [
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-blue-500",
  ];

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
      {/* Accent */}
      <span
        className={`absolute left-0 top-0 h-full w-1 ${accents[index % accents.length]}`}
      />

      <div className="pl-2">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </p>

        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </p>

        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400 sm:text-xs">
          {description}
        </p>
      </div>
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
   ICON
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