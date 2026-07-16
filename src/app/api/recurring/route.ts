import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recurringSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recurring = await db.recurringTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json(recurring);
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
    const data = recurringSchema.parse(body);

    if (data.walletId) {
      const wallet = await db.wallet.findFirst({
        where: { id: data.walletId, userId: session.userId },
      });
      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
    }

    const recurring = await db.recurringTransaction.create({
      data: {
        title: data.title,
        amount: data.amount,
        type: data.type,
        category: data.category as any,
        frequency: data.frequency,
        nextDueDate: new Date(data.nextDueDate),
        walletId: data.walletId,
        userId: session.userId,
      },
    });

    return NextResponse.json(recurring, { status: 201 });
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
