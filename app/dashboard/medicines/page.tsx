import MedicinePageLoader from "@/components/medicines/MedicinePageLoader";

type MedicinesPageProps = {
  searchParams: Promise<{
    medicine?: string;
  }>;
};

export default async function MedicinesPage({
  searchParams,
}: MedicinesPageProps) {
  const params = await searchParams;

  return (
    <MedicinePageLoader
      selectedMedicineId={params.medicine}
    />
  );
}