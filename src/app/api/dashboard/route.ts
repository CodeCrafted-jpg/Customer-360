import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Receipt } from "@/models/Receipt";

export const runtime = "nodejs";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // make Monday start of week
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [
    totalCustomers,
    customersThisMonth,
    customersThisWeek,
    totalsAll,
    totalsMonth,
    totalsWeek,
    recent,
  ] = await Promise.all([
    Customer.countDocuments({ ownerId: userId }),
    Customer.countDocuments({ ownerId: userId, createdAt: { $gte: monthStart } }),
    Customer.countDocuments({ ownerId: userId, createdAt: { $gte: weekStart } }),
    Receipt.aggregate([
      { $match: { ownerId: userId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
        },
      },
    ]),
    Receipt.aggregate([
      { $match: { ownerId: userId, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, paidAmount: { $sum: "$paidAmount" } } },
    ]),
    Receipt.aggregate([
      { $match: { ownerId: userId, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, paidAmount: { $sum: "$paidAmount" } } },
    ]),
    Receipt.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "customerId", select: "name mobile" })
      .lean(),
  ]);

  const totalAmount = totalsAll[0]?.totalAmount ?? 0;
  const paidAmount = totalsAll[0]?.paidAmount ?? 0;

  return NextResponse.json({
    customers: {
      total: totalCustomers,
      month: customersThisMonth,
      week: customersThisWeek,
    },
    revenue: {
      allTime: paidAmount,
      month: totalsMonth[0]?.paidAmount ?? 0,
      week: totalsWeek[0]?.paidAmount ?? 0,
    },
    totalDue: totalAmount - paidAmount,
    recent: recent.map((r) => {
      type PopulatedCustomer = { _id: unknown; name?: string; mobile?: string } | null;
      const c = r.customerId as PopulatedCustomer;
      return {
        _id: String(r._id),
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        createdAt: r.createdAt,
        customer: c
          ? { _id: String(c._id), name: c.name ?? "", mobile: c.mobile ?? "" }
          : null,
      };
    }),
  });
}
