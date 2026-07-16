import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, setTokenCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { encryptPassword } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const encryptedPassword = encryptPassword(data.password);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: encryptedPassword,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setTokenCookie(token);

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
