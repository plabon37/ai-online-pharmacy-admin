import OrderPageLoader from "@/components/orders/OrderPageLoader";

type OrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
    page?: string;
    order?: string;
  }>;
};

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;

  return (
    <OrderPageLoader
      initialSearch={params.search}
      initialStatus={params.status}
      initialPaymentStatus={
        params.paymentStatus
      }
      initialPage={params.page}
      initialOrderId={params.order}
    />
  );
}