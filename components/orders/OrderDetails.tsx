"use client";

import { useState } from "react";

import type {
  AdminOrder,
} from "@/components/orders/OrderList";

type OrderDetailsProps = {
  order: AdminOrder | null;
  onUpdated: (order: AdminOrder) => void;
  onClose: () => void;
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export default function OrderDetails({
  order,
  onUpdated,
  onClose,
}: OrderDetailsProps) {
  const [status, setStatus] = useState(
    order?.status ?? "PENDING"
  );

  const [paymentStatus, setPaymentStatus] =
    useState(
      order?.paymentStatus ?? "PENDING"
    );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!order) {
    return null;
  }

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/orders/${order._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status,
            paymentStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to update order"
        );
      }

      const updatedOrder =
        result.data as AdminOrder;

      onUpdated(updatedOrder);

      setSuccess(
        "Order updated successfully."
      );
    } catch (error) {
      console.error(
        "Order update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order"
      );
    } finally {
      setSaving(false);
    }
  };

  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl">
        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Order Details
            </p>

            <h2 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              #{getShortOrderId(order._id)}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ==================================================
            CONTENT
        =================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm leading-5 text-emerald-700">
                {success}
              </p>
            </div>
          )}

          <div className="space-y-5">
            {/* ==================================================
                CUSTOMER + SHIPPING
            =================================================== */}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Customer */}
              <InfoSection
                title="Customer"
                icon={<UserIcon />}
              >
                <InfoItem
                  label="Name"
                  value={
                    order.user?.name ||
                    order.shippingAddress.name ||
                    "Unknown"
                  }
                />

                <InfoItem
                  label="Email"
                  value={
                    order.user?.email ||
                    "No email"
                  }
                />

                <InfoItem
                  label="Phone"
                  value={
                    order.shippingAddress.phone ||
                    "No phone"
                  }
                />
              </InfoSection>

              {/* Shipping */}
              <InfoSection
                title="Shipping Address"
                icon={<LocationIcon />}
              >
                <InfoItem
                  label="Name"
                  value={
                    order.shippingAddress.name
                  }
                />

                <InfoItem
                  label="Address"
                  value={
                    order.shippingAddress.address
                  }
                />

                <InfoItem
                  label="City"
                  value={
                    order.shippingAddress.city
                  }
                />

                {order.shippingAddress.area && (
                  <InfoItem
                    label="Area"
                    value={
                      order.shippingAddress.area
                    }
                  />
                )}

                {order.shippingAddress
                  .postalCode && (
                  <InfoItem
                    label="Postal Code"
                    value={
                      order.shippingAddress
                        .postalCode
                    }
                  />
                )}
              </InfoSection>
            </div>

            {/* ==================================================
                ORDER ITEMS
            =================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Ordered Medicines
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {totalQuantity}{" "}
                      {totalQuantity === 1
                        ? "item"
                        : "items"}{" "}
                      in this order
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {order.items.length}{" "}
                    {order.items.length === 1
                      ? "product"
                      : "products"}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, index) => {
                  const medicine =
                    item.medicine &&
                    typeof item.medicine ===
                      "object"
                      ? item.medicine
                      : null;

                  const itemImage =
                    item.image ||
                    medicine?.image ||
                    "";

                  const itemName =
                    item.name ||
                    medicine?.name ||
                    "Medicine";

                  const subtotal =
                    Number(item.price) *
                    Number(item.quantity);

                  return (
                    <div
                      key={`${itemName}-${index}`}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                    >
                      {/* Image */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={itemName}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <MedicineIcon />
                        )}
                      </div>

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {itemName}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Unit price: ৳
                          {Number(
                            item.price
                          ).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 sm:block sm:min-w-[90px] sm:bg-transparent sm:p-0 sm:text-center">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 sm:block">
                          Quantity
                        </span>

                        <span className="text-sm font-semibold text-slate-800 sm:block sm:mt-1">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Subtotal */}
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 sm:block sm:min-w-[110px] sm:bg-transparent sm:p-0 sm:text-right">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 sm:block">
                          Subtotal
                        </span>

                        <span className="text-sm font-bold text-slate-900 sm:block sm:mt-1">
                          ৳{subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-600">
                    Order Total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    ৳
                    {Number(
                      order.totalAmount
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {/* ==================================================
                STATUS MANAGEMENT
            =================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Order Management
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Update Status
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Change the order progress and payment
                  status from the admin panel.
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* Order status */}
                <div>
                  <label
                    htmlFor="order-status"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Order Status
                  </label>

                  <select
                    id="order-status"
                    value={status}
                    onChange={(event) => {
                      setStatus(
                        event.target
                          .value as OrderStatus
                      );

                      setSuccess("");
                      setError("");
                    }}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  >
                    {ORDER_STATUSES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {formatStatus(item)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Payment status */}
                <div>
                  <label
                    htmlFor="payment-status"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Payment Status
                  </label>

                  <select
                    id="payment-status"
                    value={paymentStatus}
                    onChange={(event) => {
                      setPaymentStatus(
                        event.target
                          .value as PaymentStatus
                      );

                      setSuccess("");
                      setError("");
                    }}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  >
                    {PAYMENT_STATUSES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {formatStatus(item)}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Save */}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-xs font-semibold text-white shadow-lg shadow-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO SECTION
============================================================ */

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </span>

        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {children}
      </div>
    </section>
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
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getShortOrderId(id: string) {
  if (!id) {
    return "UNKNOWN";
  }

  return id.length > 8
    ? id.slice(-8).toUpperCase()
    : id.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

/* ============================================================
   TYPES
============================================================ */

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

/* ============================================================
   ICONS
============================================================ */

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
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
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 19C6.1 15.9 8.2 14.5 12 14.5C15.8 14.5 17.9 15.9 18.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21C16.5 16.7 19 13.4 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 13.4 7.5 16.7 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="9.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MedicineIcon() {
  return (
    <svg
      width="20"
      height="20"
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