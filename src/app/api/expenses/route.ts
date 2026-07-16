import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expenseSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const walletId = searchParams.get("walletId");
    const search = searchParams.get("search");

    const where: any = { userId: session.userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (category) where.category = category;
    if (walletId) where.walletId = walletId;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const expenses = await db.expense.findMany({
      where,
      include: { wallet: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
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
    const data = expenseSchema.parse(body);

    if (data.walletId) {
      const wallet = await db.wallet.findFirst({
        where: { id: data.walletId, userId: session.userId },
      });
      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
    }

    if (data.walletId) {
      const expense = await db.$transaction([
        db.expense.create({
          data: {
            amount: data.amount,
            category: data.category as any,
            description: data.description,
            date: data.date ? new Date(data.date) : new Date(),
            time: data.time,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            location: data.location,
            tags: data.tags || [],
            isRecurring: data.isRecurring ?? false,
            isQuick: data.isQuick ?? false,
            walletId: data.walletId,
            userId: session.userId,
          },
          include: { wallet: true },
        }),
        db.wallet.update({
          where: { id: data.walletId },
          data: { balance: { decrement: data.amount } },
        }),
      ]);
      return NextResponse.json(expense[0], { status: 201 });
    }

    const expense = await db.expense.create({
      data: {
        amount: data.amount,
        category: data.category as any,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        time: data.time,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        location: data.location,
        tags: data.tags || [],
        isRecurring: data.isRecurring ?? false,
        isQuick: data.isQuick ?? false,
        userId: session.userId,
      },
      include: { wallet: true },
    });

    return NextResponse.json(expense, { status: 201 });
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
