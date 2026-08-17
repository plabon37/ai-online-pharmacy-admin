import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        data: null,
        message: "Admin logout successful",
      },
      { status: 200 }
    );

    response.cookies.delete("admin_token");

    // Remove any old/legacy authentication cookie as well.
    response.cookies.delete("token");

    return response;
  } catch (error) {
    console.error("Admin Logout Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to logout",
      },
      { status: 500 }
    );
  }
}