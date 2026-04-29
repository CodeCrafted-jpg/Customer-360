import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  let s = await Settings.findOne({ ownerId: userId }).lean();
  if (!s) {
    const created = await Settings.create({ ownerId: userId });
    s = created.toObject();
  }

  return NextResponse.json({
    settings: {
      shopName: s.shopName,
      shopPhone: s.shopPhone,
      shopAddress: s.shopAddress,
      language: s.language,
    },
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (typeof body.shopName === "string") updates.shopName = body.shopName.trim();
  if (typeof body.shopPhone === "string") updates.shopPhone = body.shopPhone.trim();
  if (typeof body.shopAddress === "string") updates.shopAddress = body.shopAddress.trim();
  if (body.language === "en" || body.language === "hi" || body.language === "bn") {
    updates.language = body.language;
  }

  await connectDB();
  const s = await Settings.findOneAndUpdate(
    { ownerId: userId },
    { $set: updates, $setOnInsert: { ownerId: userId } },
    { new: true, upsert: true }
  ).lean();

  return NextResponse.json({
    settings: {
      shopName: s!.shopName,
      shopPhone: s!.shopPhone,
      shopAddress: s!.shopAddress,
      language: s!.language,
    },
  });
}
