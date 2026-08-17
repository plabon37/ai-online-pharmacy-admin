import CustomerPageLoader from "@/components/customers/CustomerPageLoader";

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;

  return (
    <CustomerPageLoader
      initialSearch={params.search}
      initialPage={params.page}
    />
  );
}