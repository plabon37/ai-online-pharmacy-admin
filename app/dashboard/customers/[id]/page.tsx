import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CustomerOrder = {
  _id: string;

  totalAmount: number;

  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

  paymentMethod:
    | "COD"
    | "ONLINE";

  paymentStatus:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";

  itemCount?: number;

  createdAt:
    string | null;

  updatedAt:
    string | null;
};

type CustomerData = {
  customer: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | null;
    updatedAt: string | null;
  };

  summary: {
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalSpent: number;
  };

  orders: CustomerOrder[];
};

type CustomerResponse = {
  success: boolean;
  data: CustomerData | null;
  message: string;
};

async function getCustomer(
  id: string
): Promise<CustomerData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";

    const cleanBaseUrl =
      baseUrl.replace(/\/+$/, "");

    const response = await fetch(
      `${cleanBaseUrl}/api/customers/${encodeURIComponent(
        id
      )}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    if (!response.ok) {
      console.error(
        "Customer details API failed:",
        response.status
      );

      return null;
    }

    const result =
      (await response.json()) as CustomerResponse;

    if (
      !result.success ||
      !result.data
    ) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error(
      "Customer details fetch error:",
      error
    );

    return null;
  }
}

export default async function CustomerDetailsPage({
  params,
}: PageProps) {
  const { id } =
    await params;

  const data =
    await getCustomer(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Customers
          </Link>

          <div className="mt-6 rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Customer not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              We could not load this customer,s information.
            </p>

            <Link
              href="/dashboard/customers"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Back to Customers
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const {
    customer,
    summary,
    orders,
  } = data;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Customers
          </Link>

          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Customer Management
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Customer Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View customer information and order history.
            </p>
          </div>
        </div>

        {/* ==================================================
            CUSTOMER PROFILE
        ================================================== */}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-extrabold text-white">
                {getInitials(
                  customer.name
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {customer.name}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {customer.email}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {customer.role}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Customer ID"
              value={customer._id}
            />

            <InfoItem
              label="Total Orders"
              value={String(
                summary.totalOrders
              )}
            />

            <InfoItem
              label="Total Spent"
              value={`৳${summary.totalSpent.toFixed(
                2
              )}`}
            />

            <InfoItem
              label="Member Since"
              value={formatDate(
                customer.createdAt
              )}
            />
          </div>
        </section>

        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Orders"
            value={summary.totalOrders}
            description="All customer orders"
          />

          <SummaryCard
            title="Delivered"
            value={
              summary.deliveredOrders
            }
            description="Successfully delivered"
          />

          <SummaryCard
            title="Cancelled"
            value={
              summary.cancelledOrders
            }
            description="Cancelled orders"
          />

          <SummaryCard
            title="Total Spent"
            value={`৳${summary.totalSpent.toFixed(
              2
            )}`}
            description="Completed order value"
          />
        </div>

        {/* ==================================================
            ORDER HISTORY
        ================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Order History
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Customer Orders
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              All orders placed by this customer.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <OrderIcon />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No orders found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                This customer has not placed any orders yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Order ID
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Items
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Total
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Payment
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(
                    (order) => (
                      <tr
                        key={
                          order._id
                        }
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/orders/${order._id}`}
                            className="font-mono text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            {order._id.slice(
                              0,
                              10
                            )}
                            ...
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {order.itemCount ??
                            0}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          ৳
                          {Number(
                            order.totalAmount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <PaymentBadge
                              value={
                                order.paymentStatus
                              }
                            />

                            <p className="text-[10px] font-medium text-slate-400">
                              {formatPaymentMethod(
                                order.paymentMethod
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              order.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   PAYMENT BADGE
============================================================ */

function PaymentBadge({
  value,
}: {
  value: string;
}) {
  const config: Record<
    string,
    string
  > = {
    PAID:
      "bg-emerald-50 text-emerald-700",
    PENDING:
      "bg-amber-50 text-amber-700",
    FAILED:
      "bg-red-50 text-red-700",
    REFUNDED:
      "bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        config[value] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {value}
    </span>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  value,
}: {
  value: string;
}) {
  const config: Record<
    string,
    string
  > = {
    PENDING:
      "bg-amber-50 text-amber-700",

    CONFIRMED:
      "bg-cyan-50 text-cyan-700",

    PROCESSING:
      "bg-blue-50 text-blue-700",

    SHIPPED:
      "bg-violet-50 text-violet-700",

    DELIVERED:
      "bg-emerald-50 text-emerald-700",

    CANCELLED:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        config[value] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {value}
    </span>
  );
}

/* ============================================================
   DATE
============================================================ */

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* ============================================================
   PAYMENT METHOD
============================================================ */

function formatPaymentMethod(
  method: string
) {
  if (
    method ===
    "ONLINE"
  ) {
    return "Online Payment";
  }

  return "Cash on Delivery";
}

/* ============================================================
   INITIALS
============================================================ */

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "CU";
  }

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

/* ============================================================
   ORDER ICON
============================================================ */

function OrderIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 8H16M8 12H16M8 16H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}