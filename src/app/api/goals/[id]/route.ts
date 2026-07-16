import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { goalSchema } from "@/lib/validations";

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
    const goal = await db.goal.findFirst({
      where: { id, userId: session.userId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
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
    const existing = await db.goal.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.addAmount && typeof body.addAmount === "number") {
      if (body.addAmount <= 0) {
        return NextResponse.json(
          { error: "addAmount must be a positive number" },
          { status: 400 }
        );
      }
      const newAmount = Math.max(0, existing.currentAmount + body.addAmount);
      const goal = await db.goal.update({
        where: { id },
        data: {
          currentAmount: newAmount,
          isCompleted: newAmount >= existing.targetAmount,
        },
      });
      return NextResponse.json(goal);
    }

    const data = goalSchema.parse(body);

    const goal = await db.goal.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });

    return NextResponse.json(goal);
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
    const existing = await db.goal.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.goal.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
