import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Receipt, IReceiptItem } from "@/models/Receipt";

export const runtime = "nodejs";

type RawItem = { name?: unknown; quantity?: unknown; price?: unknown };

function sanitizeItems(input: unknown): IReceiptItem[] {
  if (!Array.isArray(input)) return [];
  const items: IReceiptItem[] = [];
  for (const raw of input as RawItem[]) {
    const name = String(raw?.name ?? "").trim();
    const quantity = Number(raw?.quantity ?? 0);
    const price = Number(raw?.price ?? 0);
    if (!name) continue;
    if (!Number.isFinite(quantity) || quantity < 0) continue;
    if (!Number.isFinite(price) || price < 0) continue;
    items.push({ name, quantity, price });
  }
  return items;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const customerIdRaw: string = String(body.customerId ?? "");
  const name: string = (body.name ?? "").toString().trim();
  const address: string = (body.address ?? "").toString().trim();
  const mobile: string = (body.mobile ?? "").toString().trim();
  const note: string | undefined = body.note ? String(body.note).trim() : undefined;
  const paidAmount = Number(body.paidAmount ?? 0);
  const discountPercent = Number(body.discountPercent ?? 0);
  const items = sanitizeItems(body.items);

  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return NextResponse.json({ error: "Invalid paid amount" }, { status: 400 });
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return NextResponse.json({ error: "Discount must be 0-100" }, { status: 400 });
  }

  // Subtotal: from items if present, else from totalAmount field (legacy add-receipt form)
  let subtotal: number;
  if (items.length > 0) {
    subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
  } else {
    const ta = Number(body.totalAmount ?? 0);
    if (!Number.isFinite(ta) || ta < 0) {
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
    }
    subtotal = ta;
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  await connectDB();

  let customer = null;
  let createdCustomer = false;

  if (customerIdRaw) {
    if (!mongoose.isValidObjectId(customerIdRaw)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }
    customer = await Customer.findOne({ _id: customerIdRaw, ownerId: userId });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
  } else {
    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }
    customer = await Customer.findOne({ ownerId: userId, mobile });
    if (!customer) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for a new customer" },
          { status: 400 }
        );
      }
      customer = await Customer.create({
        ownerId: userId,
        name,
        address,
        mobile,
      });
      createdCustomer = true;
    } else {
      let changed = false;
      if (name && name !== customer.name) {
        customer.name = name;
        changed = true;
      }
      if (address && address !== customer.address) {
        customer.address = address;
        changed = true;
      }
      if (changed) await customer.save();
    }
  }

  const receipt = await Receipt.create({
    ownerId: userId,
    customerId: customer._id,
    items,
    subtotal,
    discountPercent,
    discountAmount,
    totalAmount,
    paidAmount,
    note,
  });

  return NextResponse.json({
    customer: {
      _id: String(customer._id),
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
    },
    receipt: {
      _id: String(receipt._id),
      items: receipt.items,
      subtotal: receipt.subtotal,
      discountPercent: receipt.discountPercent,
      discountAmount: receipt.discountAmount,
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      note: receipt.note,
      createdAt: receipt.createdAt,
    },
    createdCustomer,
  });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const deleted = await Receipt.findOneAndDelete({ _id: id, ownerId: userId });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
