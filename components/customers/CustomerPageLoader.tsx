import {
  connectToDB,
} from "@/lib/connectToDB";

import User from "@/lib/models/User";

import CustomerPage from "@/components/customers/CustomerPage";

import type { AdminCustomer } from "@/components/customers/CustomerList";

/* ============================================================
   CONFIG
============================================================ */

const INITIAL_LIMIT =
  10;

/* ============================================================
   PROPS
============================================================ */

type CustomerPageLoaderProps = {
  initialSearch?: string;

  initialPage?: string;
};

/* ============================================================
   PAGE LOADER
============================================================ */

export default async function CustomerPageLoader({
  initialSearch,
  initialPage,
}: CustomerPageLoaderProps) {
  /* ==========================================================
     DATABASE
  ========================================================== */

  await connectToDB();

  /* ==========================================================
     SEARCH
  ========================================================== */

  const search =
    initialSearch?.trim() || "";

  /* ==========================================================
     PAGE
  ========================================================== */

  const parsedPage =
    Number(
      initialPage
    );

  const page =
    Number.isInteger(
      parsedPage
    ) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  /* ==========================================================
     BASE FILTER
     
     ADMIN users are excluded.
  ========================================================== */

  const filter: Record<
    string,
    unknown
  > = {
    role: {
      $ne: "ADMIN",
    },
  };

  /* ==========================================================
     SEARCH FILTER
  ========================================================== */

  if (search) {
    const escapedSearch =
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
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

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const skip =
    (page - 1) *
    INITIAL_LIMIT;

  /* ==========================================================
     FETCH
     
     IMPORTANT:
     isActive MUST be selected here.
  ========================================================== */

  const [
    customers,
    totalCustomers,
  ] =
    await Promise.all([
      User.find(filter)
        .select(
          "_id name email role isActive createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(
          INITIAL_LIMIT
        )
        .lean(),

      User.countDocuments(
        filter
      ),
    ]);

  /* ==========================================================
     TOTAL PAGES
  ========================================================== */

  const totalPages =
    totalCustomers === 0
      ? 0
      : Math.ceil(
          totalCustomers /
            INITIAL_LIMIT
        );

  /* ==========================================================
     SERIALIZE
     
     IMPORTANT:
     isActive MUST be passed to the client.
  ========================================================== */

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
          customer.role ||
          "USER",

        /*
         * Preserve the actual database value.
         *
         * If false → false
         * If true → true
         *
         * Do NOT turn undefined into true here.
         */
        isActive:
          customer.isActive !== false,

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

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <CustomerPage
      initialCustomers={
        serializedCustomers
      }

      initialSearch={
        search
      }

      initialPagination={{
        page,

        limit:
          INITIAL_LIMIT,

        totalCustomers,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      }}
    />
  );
}