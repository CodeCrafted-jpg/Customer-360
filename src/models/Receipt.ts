import mongoose, { Schema, Model, Types } from "mongoose";

export interface IReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface IReceipt {
  ownerId: string;
  customerId: Types.ObjectId;
  items: IReceiptItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema<IReceiptItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReceiptSchema = new Schema<IReceipt>(
  {
    ownerId: { type: String, required: true, index: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    items: { type: [ReceiptItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Receipt: Model<IReceipt> =
  (mongoose.models.Receipt as Model<IReceipt>) ||
  mongoose.model<IReceipt>("Receipt", ReceiptSchema);
