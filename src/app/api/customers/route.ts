import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Receipt } from "@/models/Receipt";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const customers = await Customer.find({ ownerId: userId }).sort({ createdAt: -1 }).lean();

  const ids = customers.map((c) => c._id);
  const agg = await Receipt.aggregate([
    { $match: { ownerId: userId, customerId: { $in: ids } } },
    {
      $group: {
        _id: "$customerId",
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: { $sum: "$paidAmount" },
        receiptCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(agg.map((a) => [String(a._id), a]));
  const result = customers.map((c) => {
    const a = map.get(String(c._id));
    const totalAmount = a?.totalAmount ?? 0;
    const paidAmount = a?.paidAmount ?? 0;
    return {
      _id: String(c._id),
      name: c.name,
      address: c.address,
      mobile: c.mobile,
      createdAt: c.createdAt,
      totalAmount,
      paidAmount,
      due: totalAmount - paidAmount,
      receiptCount: a?.receiptCount ?? 0,
    };
  });

  return NextResponse.json({ customers: result });
}

/**
 * Single endpoint that the user described:
 *  - input: name, address, mobile, totalAmount, paidAmount, optional note
 *  - if mobile is new -> create customer + receipt
 *  - if mobile exists -> add receipt to that customer (update name/address if provided)
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name: string = (body.name ?? "").toString().trim();
  const address: string = (body.address ?? "").toString().trim();
  const mobile: string = (body.mobile ?? "").toString().trim();
  const totalAmount = Number(body.totalAmount ?? 0);
  const paidAmount = Number(body.paidAmount ?? 0);
  const note: string | undefined = body.note ? String(body.note).trim() : undefined;

  if (!mobile) {
    return NextResponse.json({ error: "Mobile is required" }, { status: 400 });
  }
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
  }
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return NextResponse.json({ error: "Invalid paid amount" }, { status: 400 });
  }

  await connectDB();

  let customer = await Customer.findOne({ ownerId: userId, mobile });
  let createdCustomer = false;

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

  const receipt = await Receipt.create({
    ownerId: userId,
    customerId: customer._id,
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
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      note: receipt.note,
      createdAt: receipt.createdAt,
    },
    createdCustomer,
  });
}
