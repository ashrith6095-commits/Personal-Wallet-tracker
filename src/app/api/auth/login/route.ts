import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setTokenCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { decryptPassword, isBcryptHash } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let isPasswordValid: boolean;
    if (isBcryptHash(user.password)) {
      isPasswordValid = await compare(data.password, user.password);
    } else {
      const decryptedPassword = decryptPassword(user.password);
      isPasswordValid = decryptedPassword === data.password;
    }
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setTokenCookie(token);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
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
