import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Receipt } from "@/models/Receipt";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const customer = await Customer.findOne({ _id: id, ownerId: userId }).lean();
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const receipts = await Receipt.find({ ownerId: userId, customerId: id })
    .sort({ createdAt: -1 })
    .lean();

  const totals = receipts.reduce(
    (acc, r) => {
      acc.totalAmount += r.totalAmount;
      acc.paidAmount += r.paidAmount;
      return acc;
    },
    { totalAmount: 0, paidAmount: 0 }
  );

  return NextResponse.json({
    customer: {
      _id: String(customer._id),
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      createdAt: customer.createdAt,
    },
    receipts: receipts.map((r) => ({
      _id: String(r._id),
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      note: r.note,
      createdAt: r.createdAt,
    })),
    totals: {
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      due: totals.totalAmount - totals.paidAmount,
    },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  await connectDB();
  const updates: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.address === "string") updates.address = body.address.trim();
  if (typeof body.mobile === "string" && body.mobile.trim()) updates.mobile = body.mobile.trim();

  const customer = await Customer.findOneAndUpdate(
    { _id: id, ownerId: userId },
    { $set: updates },
    { new: true }
  ).lean();

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const deleted = await Customer.findOneAndDelete({ _id: id, ownerId: userId });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await Receipt.deleteMany({ ownerId: userId, customerId: id });
  return NextResponse.json({ ok: true });
}
