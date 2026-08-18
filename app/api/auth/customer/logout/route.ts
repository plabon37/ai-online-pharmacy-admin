import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const response =
      NextResponse.json(
        {
          success: true,
          data: null,
          message:
            "Customer logout successful",
        },
        { status: 200 }
      );

    /* ========================================================
       CLEAR CUSTOMER TOKEN
    ======================================================== */

    response.cookies.set(
      "customer_token",
      "",
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Customer Logout Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "Failed to logout",
      },
      { status: 500 }
    );
  }
}