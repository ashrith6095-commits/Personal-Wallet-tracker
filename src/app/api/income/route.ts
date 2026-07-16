import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { incomeSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { userId: session.userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const incomes = await db.income.findMany({
      where,
      include: { wallet: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(incomes);
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
    const data = incomeSchema.parse(body);

    if (data.walletId) {
      const wallet = await db.wallet.findFirst({
        where: { id: data.walletId, userId: session.userId },
      });
      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
    }

    if (data.walletId) {
      const [income] = await db.$transaction([
        db.income.create({
          data: {
            amount: data.amount,
            category: data.category as any,
            description: data.description,
            date: data.date ? new Date(data.date) : new Date(),
            notes: data.notes,
            walletId: data.walletId,
            userId: session.userId,
          },
          include: { wallet: true },
        }),
        db.wallet.update({
          where: { id: data.walletId },
          data: { balance: { increment: data.amount } },
        }),
      ]);
      return NextResponse.json(income, { status: 201 });
    }

    const income = await db.income.create({
      data: {
        amount: data.amount,
        category: data.category as any,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
        userId: session.userId,
      },
      include: { wallet: true },
    });

    return NextResponse.json(income, { status: 201 });
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
