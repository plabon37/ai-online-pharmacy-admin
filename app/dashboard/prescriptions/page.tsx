import PrescriptionPageLoader from "@/components/prescriptions/PrescriptionPageLoader";

type PrescriptionsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

export default async function PrescriptionsPage({
  searchParams,
}: PrescriptionsPageProps) {
  const params = await searchParams;

  return (
    <PrescriptionPageLoader
      initialSearch={params.search}
      initialStatus={params.status}
    />
  );
}