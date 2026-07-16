import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        timezone: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, currency, timezone, theme } = body;

    const data: Record<string, string> = {};
    if (name && typeof name === "string" && name.trim().length >= 2) {
      data.name = name.trim();
    }
    if (currency && typeof currency === "string") {
      data.currency = currency;
    }
    if (timezone && typeof timezone === "string") {
      data.timezone = timezone;
    }
    if (theme && typeof theme === "string") {
      data.theme = theme;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        timezone: true,
        theme: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
