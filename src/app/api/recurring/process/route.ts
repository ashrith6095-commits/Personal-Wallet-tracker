import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function advanceNextDueDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dueRecurring = await db.recurringTransaction.findMany({
      where: {
        userId: session.userId,
        isActive: true,
        nextDueDate: { lte: now },
      },
    });

    if (dueRecurring.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

    for (const recurring of dueRecurring) {
      try {
        await db.$transaction(async (tx) => {
          if (recurring.type === "EXPENSE") {
            const expenseData: any = {
              amount: recurring.amount,
              category: (recurring.category as any) || "OTHERS",
              description: recurring.title,
              date: now,
              isRecurring: true,
              userId: session.userId,
            };
            if (recurring.walletId) {
              expenseData.walletId = recurring.walletId;
            }
            await tx.expense.create({ data: expenseData });
            if (recurring.walletId) {
              await tx.wallet.update({
                where: { id: recurring.walletId },
                data: { balance: { decrement: recurring.amount } },
              });
            }
          } else {
            const incomeData: any = {
              amount: recurring.amount,
              category: "OTHERS",
              description: recurring.title,
              date: now,
              userId: session.userId,
            };
            if (recurring.walletId) {
              incomeData.walletId = recurring.walletId;
            }
            await tx.income.create({ data: incomeData });
            if (recurring.walletId) {
              await tx.wallet.update({
                where: { id: recurring.walletId },
                data: { balance: { increment: recurring.amount } },
              });
            }
          }

          const nextDue = advanceNextDueDate(now, recurring.frequency);
          await tx.recurringTransaction.update({
            where: { id: recurring.id },
            data: {
              nextDueDate: nextDue,
              lastGenerated: now,
            },
          });
        });
        processed++;
      } catch {
        // Skip this recurring transaction on error
      }
    }

    return NextResponse.json({ processed });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
