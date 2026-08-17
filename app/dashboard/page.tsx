import { redirect } from "next/navigation";

import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { getCurrentAdmin } from "@/lib/auth/getCurrentAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/");
  }

  return <DashboardOverview admin={admin} />;
}