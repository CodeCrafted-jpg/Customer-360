import mongoose, { Schema, Model } from "mongoose";

export interface ICustomer {
  ownerId: string;
  name: string;
  address: string;
  mobile: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ ownerId: 1, mobile: 1 }, { unique: true });

export const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
