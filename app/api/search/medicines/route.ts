import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Types,
} from "mongoose";

import {
  connectToDB,
} from "@/lib/connectToDB";

import Medicine from "@/lib/models/Medicine";

import Category from "@/lib/models/Category";

/* ============================================================
   CONFIG
============================================================ */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   TYPES
============================================================ */

/*
 * Category after populate().
 */
type SearchCategory = {
  _id: Types.ObjectId;

  name?: string;
};

/*
 * Explicit lean medicine shape.
 *
 * This avoids the Mongoose Document/ObjectId inference problem
 * around medicine.genericName, medicine.price, medicine.category,
 * etc.
 */
type SearchMedicine = {
  _id: Types.ObjectId;

  name: string;

  genericName?: string;

  description?: string;

  price?: number;

  stock?: number;

  image?: string;

  category?:
    | Types.ObjectId
    | SearchCategory
    | null;
};

/* ============================================================
   CORS
============================================================ */

const CLIENT_ORIGIN = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3001"
).replace(
  /\/+$/,
  ""
);

/* ============================================================
   CORS HELPER
============================================================ */

function applyCors(
  response: NextResponse
) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    CLIENT_ORIGIN
  );

  response.headers.set(
    "Access-Control-Allow-Credentials",
    "true"
  );

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  response.headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  response.headers.set(
    "Vary",
    "Origin"
  );

  return response;
}

/* ============================================================
   ORIGIN VALIDATION
============================================================ */

function isAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return true;
  }

  return (
    origin.replace(
      /\/+$/,
      ""
    ) === CLIENT_ORIGIN
  );
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  if (
    !isAllowedOrigin(
      request
    )
  ) {
    return new NextResponse(
      null,
      {
        status: 403,
      }
    );
  }

  return applyCors(
    new NextResponse(
      null,
      {
        status: 204,
      }
    )
  );
}

/* ============================================================
   GET - SEARCH MEDICINES
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       ORIGIN
    ======================================================== */

    if (
      !isAllowedOrigin(
        request
      )
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid client origin",
          },
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectToDB();

    /* ========================================================
       QUERY PARAMETERS
    ======================================================== */

    const searchParams =
      request.nextUrl.searchParams;

    const query =
      (
        searchParams.get(
          "q"
        ) || ""
      ).trim();

    /* ========================================================
       PAGINATION
    ======================================================== */

    const requestedPage =
      Number(
        searchParams.get(
          "page"
        ) || "1"
      );

    const requestedLimit =
      Number(
        searchParams.get(
          "limit"
        ) || "12"
      );

    const page =
      Number.isInteger(
        requestedPage
      ) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(
        requestedLimit
      ) &&
      requestedLimit > 0
        ? Math.min(
            requestedLimit,
            50
          )
        : 12;

    /* ========================================================
       EMPTY SEARCH
    ======================================================== */

    if (!query) {
      return applyCors(
        NextResponse.json(
          {
            success: true,

            data: {
              medicines: [],

              pagination: {
                page: 1,

                limit,

                total: 0,

                totalPages: 0,

                hasNextPage:
                  false,

                hasPreviousPage:
                  false,
              },

              filters: {
                q: "",
              },
            },

            message:
              "Please provide a medicine search query",
          },
          {
            status: 200,
          }
        )
      );
    }

    /* ========================================================
       ESCAPE REGEX
    ======================================================== */

    const escapedQuery =
      query.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
        escapedQuery,
        "i"
      );

    /* ========================================================
       CATEGORY SEARCH
       
       We only search category name here.
       This avoids requiring a slug field in Category.
    ======================================================== */

    const matchingCategories =
      await Category.find({
        name: regex,
      })
        .select("_id")
        .lean();

    const categoryIds =
      matchingCategories.map(
        (
          category
        ) =>
          category._id
      );

    /* ========================================================
       MEDICINE FILTER
    ======================================================== */

    const orConditions: Array<
      Record<string, unknown>
    > = [
      {
        name: regex,
      },

      {
        genericName:
          regex,
      },

      {
        description:
          regex,
      },
    ];

    /* ========================================================
       ADD CATEGORY MATCH
    ======================================================== */

    if (
      categoryIds.length >
      0
    ) {
      orConditions.push({
        category: {
          $in: categoryIds,
        },
      });
    }

    const filter: Record<
      string,
      unknown
    > = {
      isActive: true,

      $or:
        orConditions,
    };

    /* ========================================================
       PAGINATION
    ======================================================== */

    const skip =
      (page - 1) *
      limit;

    /* ========================================================
       FETCH MEDICINES
       
       IMPORTANT:
       The explicit generic on lean() fixes the TypeScript
       inference problem shown in your screenshot.
    ======================================================== */

    const [
      rawMedicines,
      total,
    ] = await Promise.all([
      Medicine.find(
        filter
      )
        .populate({
          path: "category",

          select:
            "name",
        })
        .select(
          "_id name genericName description price stock image category"
        )
        .sort({
          name: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean<SearchMedicine[]>(),

      Medicine.countDocuments(
        filter
      ),
    ]);

    /* ========================================================
       SERIALIZE MEDICINES
    ======================================================== */

    const serializedMedicines =
      rawMedicines.map(
        (
          medicine
        ) => {
          /* ==================================================
             CATEGORY
          ================================================== */

          let serializedCategory:
            | {
                _id: string;

                name: string;
              }
            | null = null;

          if (
            medicine.category &&
            !(
              medicine.category instanceof
              Types.ObjectId
            )
          ) {
            serializedCategory = {
              _id:
                medicine.category._id.toString(),

              name:
                medicine.category.name ||
                "",
            };
          }

          /* ==================================================
             RETURN SAFE DATA
          ================================================== */

          return {
            _id:
              medicine._id.toString(),

            name:
              medicine.name ||
              "",

            genericName:
              medicine.genericName ||
              "",

            /*
             * Your existing Medicine model does not
             * contain a slug field, so use _id.
             */
            slug:
              medicine._id.toString(),

            description:
              medicine.description ||
              "",

            price:
              Number(
                medicine.price ||
                  0
              ),

            stock:
              Number(
                medicine.stock ||
                  0
              ),

            image:
              medicine.image ||
              "",

            category:
              serializedCategory,
          };
        }
      );

    /* ========================================================
       PAGINATION
    ======================================================== */

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          );

    /* ========================================================
       RESPONSE
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: true,

          data: {
            medicines:
              serializedMedicines,

            pagination: {
              page,

              limit,

              total,

              totalPages,

              hasNextPage:
                page <
                totalPages,

              hasPreviousPage:
                page > 1,
            },

            filters: {
              q: query,
            },
          },

          message:
            "Medicines searched successfully",
        },
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Search Medicines Error:",
      error
    );

    return applyCors(
      NextResponse.json(
        {
          success: false,

          data: null,

          message:
            error instanceof Error
              ? error.message
              : "Failed to search medicines",
        },
        {
          status: 500,
        }
      )
    );
  }
}