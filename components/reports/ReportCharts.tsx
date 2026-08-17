"use client";

type ReportChartsProps = {
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
  };

  revenue: {
    total: number;
  };

  medicines: {
    total: number;
    sold: number;
    lowStock: number;
    outOfStock: number;
  };
};

export default function ReportCharts({
  orders,
  revenue,
  medicines,
}: ReportChartsProps) {
  const orderValues = [
    {
      label: "Pending",
      value: orders.pending,
      className: "bg-amber-500",
      trackClassName: "bg-amber-50",
    },
    {
      label: "Processing",
      value: orders.processing,
      className: "bg-blue-500",
      trackClassName: "bg-blue-50",
    },
    {
      label: "Delivered",
      value: orders.delivered,
      className: "bg-emerald-500",
      trackClassName: "bg-emerald-50",
    },
    {
      label: "Cancelled",
      value: orders.cancelled,
      className: "bg-red-500",
      trackClassName: "bg-red-50",
    },
  ];

  const maxOrderValue = Math.max(
    orders.pending,
    orders.processing,
    orders.delivered,
    orders.cancelled,
    1
  );

  const inventoryValues = [
    {
      label: "Healthy Stock",
      value: Math.max(
        medicines.total -
          medicines.lowStock -
          medicines.outOfStock,
        0
      ),
      className: "bg-emerald-500",
    },
    {
      label: "Low Stock",
      value: medicines.lowStock,
      className: "bg-amber-500",
    },
    {
      label: "Out of Stock",
      value: medicines.outOfStock,
      className: "bg-red-500",
    },
  ];

  const maxInventoryValue = Math.max(
    ...inventoryValues.map(
      (item) => item.value
    ),
    1
  );

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {/* ======================================================
          ORDER STATUS ANALYTICS
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Order Analytics
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Order Status
            </h2>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Current distribution of customer orders.
            </p>
          </div>

          <div className="w-fit rounded-full bg-slate-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {orders.total} total
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {orderValues.map((item) => {
            const percentage =
              (item.value / maxOrderValue) * 100;

            const share =
              orders.total > 0
                ? Math.round(
                    (item.value /
                      orders.total) *
                      100
                  )
                : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-600 sm:text-sm">
                    {item.label}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {item.value}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {share}%
                    </span>
                  </div>
                </div>

                <div
                  className={`h-3 w-full overflow-hidden rounded-full ${item.trackClassName}`}
                >
                  <div
                    className={`h-full rounded-full ${item.className} transition-all duration-700`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Revenue */}
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Total Revenue
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl">
            ৳
            {Number(
              revenue.total
            ).toFixed(2)}
          </p>

          <p className="mt-1 text-[11px] text-emerald-600/70">
            Revenue from non-cancelled orders.
          </p>
        </div>
      </div>

      {/* ======================================================
          INVENTORY ANALYTICS
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            Inventory Analytics
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Medicine Stock
          </h2>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Current medicine inventory condition.
          </p>
        </div>

        {/* Inventory visual */}
        <div className="mt-6 flex h-48 items-end gap-3 sm:h-56">
          {inventoryValues.map(
            (item) => {
              const height =
                (item.value /
                  maxInventoryValue) *
                100;

              return (
                <div
                  key={item.label}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div className="mb-2 text-xs font-bold text-slate-700">
                    {item.value}
                  </div>

                  <div className="flex h-full w-full max-w-[80px] items-end overflow-hidden rounded-t-2xl bg-slate-50">
                    <div
                      className={`w-full rounded-t-2xl ${item.className} transition-all duration-700`}
                      style={{
                        height: `${Math.max(
                          height,
                          item.value > 0
                            ? 8
                            : 0
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 max-w-[90px] truncate text-center text-[10px] font-semibold text-slate-500 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              );
            }
          )}
        </div>

        {/* Inventory summary */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InventoryCard
            label="Total"
            value={medicines.total}
            description="Active medicines"
            className="bg-slate-50 text-slate-700"
          />

          <InventoryCard
            label="Low Stock"
            value={medicines.lowStock}
            description="Needs attention"
            className="bg-amber-50 text-amber-700"
          />

          <InventoryCard
            label="Out of Stock"
            value={medicines.outOfStock}
            description="Unavailable"
            className="bg-red-50 text-red-700"
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   INVENTORY CARD
============================================================ */

function InventoryCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: number;
  description: string;
  className: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-3 ${className}`}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 truncate text-[10px] opacity-70">
        {description}
      </p>
    </div>
  );
}