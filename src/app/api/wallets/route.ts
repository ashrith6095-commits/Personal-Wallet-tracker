import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { walletSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await db.wallet.findMany({
      where: { userId: session.userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = walletSchema.parse(body);

    if (data.isDefault) {
      await db.wallet.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const wallet = await db.wallet.create({
      data: {
        name: data.name,
        type: data.type as any,
        balance: data.balance ?? 0,
        icon: data.icon,
        color: data.color,
        isDefault: data.isDefault ?? false,
        userId: session.userId,
      },
    });

    return NextResponse.json(wallet, { status: 201 });
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
