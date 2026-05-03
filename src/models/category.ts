import { Schema, model } from "mongoose";
import type ICategorySchema from "../Interfaces/ICategorySchema.js";
import { z } from "zod";

const categorySchema = new Schema<ICategorySchema>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    img: {
      type: String,
    },
  },
  { versionKey: false },
);

export const Category = model<ICategorySchema>("Categories", categorySchema);

const commonSchema = {
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(500).trim().optional(),
};

export const createCategorySchema = z
  .object({
    ...commonSchema,
  })
  .strict();

export const updateCategorySchema = z
  .object({
    ...commonSchema,
    deletedImg: z.string().trim().optional(),
  })
  .strict();

/* Extracting typescript types from schemas  */
export type ICreateCategory = z.infer<typeof createCategorySchema>;
export type IUpdateCategory = z.infer<typeof updateCategorySchema>;
