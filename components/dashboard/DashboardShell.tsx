"use client";

import {
  ReactNode,
  useState,
} from "react";

import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

export type DashboardNotificationCounts = {
  outOfStock: number;
  lowStock: number;
  pendingOrders: number;
  pendingPrescriptions: number;
  totalNotifications: number;
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [
    notificationCounts,
    setNotificationCounts,
  ] =
    useState<DashboardNotificationCounts | null>(
      null
    );

  const handleNotificationsLoaded = (
    data: DashboardNotificationCounts
  ) => {
    setNotificationCounts(data);
  };

  return (
    <div className="min-h-screen bg-[#f6f9f8]">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        notificationCounts={
          notificationCounts
        }
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="min-h-screen md:pl-[280px]">
        {/* ===================================================
            NAVBAR
        ==================================================== */}

        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onNotificationsLoaded={
            handleNotificationsLoaded
          }
        />

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <main className="min-h-[calc(100vh-84px)] px-3 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}