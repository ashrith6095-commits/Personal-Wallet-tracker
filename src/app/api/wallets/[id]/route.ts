import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { walletSchema } from "@/lib/validations";

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
    const wallet = await db.wallet.findFirst({
      where: { id, userId: session.userId },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(wallet);
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
    const existing = await db.wallet.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = walletSchema.parse(body);

    if (data.isDefault) {
      await db.wallet.updateMany({
        where: { userId: session.userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const wallet = await db.wallet.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type as any,
        icon: data.icon,
        color: data.color,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json(wallet);
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
    const existing = await db.wallet.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingWalletCount = await db.wallet.count({
      where: { userId: session.userId },
    });
    if (existingWalletCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last wallet" },
        { status: 400 }
      );
    }

    await db.wallet.delete({ where: { id } });

    if (existing.isDefault) {
      const anotherWallet = await db.wallet.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
      });
      if (anotherWallet) {
        await db.wallet.update({
          where: { id: anotherWallet.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
