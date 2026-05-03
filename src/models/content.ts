import { Schema, isValidObjectId, model } from "mongoose";
import type IContentSchema from "../Interfaces/IContentSchema.js";
import { z } from "zod";

const contentSchema = new Schema<IContentSchema>(
  {
    title: {
      type: String,
      required: true,
      maxLength: 255,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      maxLength: 255,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Categories", // Categories are managed separately
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: {
      type: String,
      required: true,
      maxLength: 2000,
      trim: true,
    },
    mainImage: {
      type: String,
    },
    pdf: {
      type: String,
    },
    audio: {
      type: String,
    },
    gallery: {
      type: [String],
    },
    uploader: {
      type: String,
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

contentSchema.index({ title: "text", author: "text", description: "text" });

export const Content = model<IContentSchema>("Contents", contentSchema);

const commonSchema = {
  title: z.string().min(1).max(255).trim(),
  author: z.string().min(1).max(255).trim(),
  category: z.string().refine((val) => isValidObjectId(val), {
    message: "Invalid Category ID",
  }),
  rating: z.number().min(1).max(5),
  description: z.string().min(1).max(2000).trim(),
};

export const createContentSchema = z
  .object({
    ...commonSchema,
  })
  .strict();

export const updateContentSchema = z
  .object({
    ...commonSchema,

    deletedMainImage: z.string().trim().optional(),
    deletedPdf: z.string().trim().optional(),
    deletedAudio: z.string().trim().optional(),
    deletedGallery: z.array(z.string().trim()).optional(),
  })
  .strict();

export const contentFilterSchema = z
  .object({
    category: z.string().refine((val) => isValidObjectId(val), {
      message: "Invalid MongoDB ObjectId",
    }),
    author: z.string().trim(),
    rating: z.coerce.number().min(1).max(5),
    searchKey: z.string().trim(),
  })
  .strict()
  .partial();

/* Extracting typescript types from schemas  */
export type ICreateContent = z.infer<typeof createContentSchema>;
export type IUpdateContent = z.infer<typeof updateContentSchema>;
export type IContentFilter = z.infer<typeof contentFilterSchema>;
