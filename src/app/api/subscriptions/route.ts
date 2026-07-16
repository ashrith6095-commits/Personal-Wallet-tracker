import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { subscriptionSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId: session.userId },
      orderBy: { nextRenewal: "asc" },
    });

    return NextResponse.json(subscriptions);
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
    const data = subscriptionSchema.parse(body);

    const subscription = await db.subscription.create({
      data: {
        name: data.name,
        icon: data.icon,
        amount: data.amount,
        billingCycle: data.billingCycle,
        nextRenewal: new Date(data.nextRenewal),
        notes: data.notes,
        userId: session.userId,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
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
