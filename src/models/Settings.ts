import mongoose, { Schema, Model } from "mongoose";

export interface ISettings {
  ownerId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  language: "en" | "hi" | "bn";
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    ownerId: { type: String, required: true, unique: true, index: true },
    shopName: { type: String, default: "My Shop", trim: true },
    shopPhone: { type: String, default: "", trim: true },
    shopAddress: { type: String, default: "", trim: true },
    language: { type: String, enum: ["en", "hi", "bn"], default: "en" },
  },
  { timestamps: true }
);

export const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings>) ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
