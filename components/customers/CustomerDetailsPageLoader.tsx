import CustomerDetailsPage from "@/components/customers/CustomerDetailsPage";

type CustomerDetailsPageLoaderProps = {
  customerId: string;
};

export default async function CustomerDetailsPageLoader({
  customerId,
}: CustomerDetailsPageLoaderProps) {
  return (
    <CustomerDetailsPage
      customerId={customerId}
    />
  );
}