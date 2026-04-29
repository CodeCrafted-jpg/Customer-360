import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Receipt } from "@/models/Receipt";
import { Settings } from "@/models/Settings";

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
  const receipt = await Receipt.findOne({ _id: id, ownerId: userId }).lean();
  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [customer, settings] = await Promise.all([
    Customer.findOne({ _id: receipt.customerId, ownerId: userId }).lean(),
    Settings.findOne({ ownerId: userId }).lean(),
  ]);

  return NextResponse.json({
    receipt: {
      _id: String(receipt._id),
      items: receipt.items ?? [],
      subtotal: receipt.subtotal ?? receipt.totalAmount,
      discountPercent: receipt.discountPercent ?? 0,
      discountAmount: receipt.discountAmount ?? 0,
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      note: receipt.note,
      createdAt: receipt.createdAt,
    },
    customer: customer
      ? {
          _id: String(customer._id),
          name: customer.name,
          address: customer.address,
          mobile: customer.mobile,
        }
      : null,
    shop: {
      shopName: settings?.shopName ?? "My Shop",
      shopPhone: settings?.shopPhone ?? "",
      shopAddress: settings?.shopAddress ?? "",
    },
  });
}
