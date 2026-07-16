import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { budgetSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = { userId: session.userId };

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    const budgets = await db.budget.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const monthStart = new Date(yearNum, monthNum - 1, 1);
      const monthEnd = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      const expenses = await db.expense.findMany({
        where: {
          userId: session.userId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true, category: true },
      });

      const spentByCategory: Record<string, number> = {};
      let totalSpent = 0;
      for (const e of expenses) {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
        totalSpent += e.amount;
      }

      const budgetsWithSpent = budgets.map((b) => ({
        ...b,
        spent: b.category ? (spentByCategory[b.category as string] || 0) : totalSpent,
      }));

      return NextResponse.json(budgetsWithSpent);
    }

    return NextResponse.json(budgets);
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
    const data = budgetSchema.parse(body);

    const budget = await db.budget.create({
      data: {
        name: data.name,
        amount: data.amount,
        category: data.category as any,
        month: data.month,
        year: data.year,
        walletId: data.walletId,
        userId: session.userId,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A budget for this category already exists for this month" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
