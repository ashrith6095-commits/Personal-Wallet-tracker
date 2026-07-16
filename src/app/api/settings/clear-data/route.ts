import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    await db.$transaction([
      db.receipt.deleteMany({ where: { userId } }),
      db.expense.deleteMany({ where: { userId } }),
      db.income.deleteMany({ where: { userId } }),
      db.budget.deleteMany({ where: { userId } }),
      db.goal.deleteMany({ where: { userId } }),
      db.subscription.deleteMany({ where: { userId } }),
      db.recurringTransaction.deleteMany({ where: { userId } }),
      db.borrowLend.deleteMany({ where: { userId } }),
      db.notification.deleteMany({ where: { userId } }),
      db.passwordReset.deleteMany({ where: { userId } }),
      db.wallet.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ message: "All data cleared successfully" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
