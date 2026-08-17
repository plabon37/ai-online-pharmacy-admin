import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDB";

export async function GET() {
  try {
    await connectToDB();

    return NextResponse.json({
      success: true,
      data: null,
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    console.error("Test DB Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}