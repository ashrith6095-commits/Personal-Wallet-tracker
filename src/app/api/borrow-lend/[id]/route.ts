import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { borrowLendSchema } from "@/lib/validations";

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
    const borrowLend = await db.borrowLend.findFirst({
      where: { id, userId: session.userId },
    });

    if (!borrowLend) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(borrowLend);
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
    const existing = await db.borrowLend.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.settleAmount && typeof body.settleAmount === "number") {
      if (body.settleAmount <= 0) {
        return NextResponse.json(
          { error: "settleAmount must be positive" },
          { status: 400 }
        );
      }
      const newSettled = existing.settled + body.settleAmount;
      if (newSettled > existing.amount) {
        return NextResponse.json(
          { error: "Settle amount exceeds remaining balance" },
          { status: 400 }
        );
      }
      const borrowLend = await db.borrowLend.update({
        where: { id },
        data: {
          settled: newSettled,
          isSettled: newSettled >= existing.amount,
        },
      });
      return NextResponse.json(borrowLend);
    }

    const data = borrowLendSchema.parse(body);

    if (data.amount < existing.settled) {
      return NextResponse.json(
        { error: "Amount cannot be less than already settled amount" },
        { status: 400 }
      );
    }

    const borrowLend = await db.borrowLend.update({
      where: { id },
      data: {
        type: data.type,
        personName: data.personName,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        reminder: data.reminder,
      },
    });

    return NextResponse.json(borrowLend);
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
    const existing = await db.borrowLend.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.borrowLend.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
