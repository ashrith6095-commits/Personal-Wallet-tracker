import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expenseSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expense = await db.expense.findFirst({
      where: { id, userId: session.userId },
      include: { wallet: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.expense.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = expenseSchema.parse(body);

    const newWalletId = data.walletId || null;
    const oldWalletId = existing.walletId;

    if (newWalletId && newWalletId !== oldWalletId) {
      const newWallet = await db.wallet.findFirst({
        where: { id: newWalletId, userId: session.userId },
      });
      if (!newWallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
    }

    const walletBalanceOps: any[] = [];

    if (oldWalletId && newWalletId && oldWalletId !== newWalletId) {
      walletBalanceOps.push(
        db.wallet.update({
          where: { id: oldWalletId },
          data: { balance: { increment: existing.amount } },
        }),
        db.wallet.update({
          where: { id: newWalletId },
          data: { balance: { decrement: data.amount } },
        })
      );
    } else if (oldWalletId && newWalletId && oldWalletId === newWalletId) {
      const diff = data.amount - existing.amount;
      if (diff !== 0) {
        walletBalanceOps.push(
          db.wallet.update({
            where: { id: oldWalletId },
            data: { balance: { decrement: diff } },
          })
        );
      }
    } else if (oldWalletId && !newWalletId) {
      walletBalanceOps.push(
        db.wallet.update({
          where: { id: oldWalletId },
          data: { balance: { increment: existing.amount } },
        })
      );
    }

    const [expense] = await db.$transaction([
      db.expense.update({
        where: { id },
        data: {
          amount: data.amount,
          category: data.category as any,
          description: data.description,
          date: data.date ? new Date(data.date) : undefined,
          time: data.time,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          location: data.location,
          tags: data.tags,
          isRecurring: data.isRecurring,
          isQuick: data.isQuick,
          walletId: newWalletId,
        },
        include: { wallet: true },
      }),
      ...walletBalanceOps,
    ]);

    return NextResponse.json(expense);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.expense.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.walletId) {
      await db.$transaction([
        db.expense.delete({ where: { id } }),
        db.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: existing.amount } },
        }),
      ]);
    } else {
      await db.expense.delete({ where: { id } });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
