import { connectToDB } from "@/lib/connectToDB";

import User from "@/lib/models/User";

import CustomerPage from "@/components/customers/CustomerPage";

import type { AdminCustomer } from "@/components/customers/CustomerList";

const INITIAL_LIMIT = 10;

type CustomerPageLoaderProps = {
  initialSearch?: string;
  initialPage?: string;
};

export default async function CustomerPageLoader({
  initialSearch,
  initialPage,
}: CustomerPageLoaderProps) {
  await connectToDB();

  const search =
    initialSearch?.trim() || "";

  const parsedPage =
    Number(initialPage);

  const page =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const filter: Record<
    string,
    unknown
  > = {
    role: {
      $ne: "ADMIN",
    },
  };

  if (search) {
    const escapedSearch =
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex = new RegExp(
      escapedSearch,
      "i"
    );

    filter.$or = [
      {
        name: regex,
      },
      {
        email: regex,
      },
    ];
  }

  const skip =
    (page - 1) * INITIAL_LIMIT;

  const [
    customers,
    totalCustomers,
  ] = await Promise.all([
    User.find(filter)
      .select(
        "_id name email role createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(INITIAL_LIMIT)
      .lean(),

    User.countDocuments(filter),
  ]);

  const totalPages =
    totalCustomers === 0
      ? 0
      : Math.ceil(
          totalCustomers /
            INITIAL_LIMIT
        );

  const serializedCustomers: AdminCustomer[] =
    customers.map(
      (customer) => ({
        _id:
          customer._id.toString(),

        name:
          customer.name || "",

        email:
          customer.email || "",

        role:
          customer.role || "USER",

        createdAt:
          customer.createdAt
            ? customer.createdAt.toISOString()
            : null,

        updatedAt:
          customer.updatedAt
            ? customer.updatedAt.toISOString()
            : null,
      })
    );

  return (
    <CustomerPage
      initialCustomers={
        serializedCustomers
      }
      initialSearch={search}
      initialPagination={{
        page,
        limit: INITIAL_LIMIT,
        totalCustomers,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      }}
    />
  );
}