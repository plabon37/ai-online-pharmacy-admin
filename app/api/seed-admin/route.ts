import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDB } from "@/lib/connectToDB";
import User from "@/lib/models/User";

export async function POST() {
  try {
    await connectToDB();

    const adminEmail = "smartpharmacy@gmail.com";
    const adminPassword = "Admin@1234";

    const existingAdmin = await User.findOne({
      email: adminEmail,
    }).select("+password");

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Admin account already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await User.create({
      name: "Smart Pharmacy Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
        message: "Admin account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed Admin Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to create admin account",
      },
      { status: 500 }
    );
  }
}