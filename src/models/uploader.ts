import { Schema, model } from "mongoose";
import type IUploaderSchema from "../Interfaces/IUploaderSchema.js";
import { z } from "zod";

const uploaderSchema = new Schema<IUploaderSchema>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { versionKey: false },
);

export const Uploader = model<IUploaderSchema>("Uploaders", uploaderSchema);

const commonSchema = {
  username: z.string().min(1).max(255).trim(),
  password: z.string().min(6).max(255),
};

export const createUploaderSchema = z
  .object({
    ...commonSchema,
  })
  .strict();

export const updateUploaderSchema = z
  .object({
    ...commonSchema,
  })
  .strict();

/* Extracting typescript types from schemas  */
export type ICreateUploader = z.infer<typeof createUploaderSchema>;
export type IUpdateUploader = z.infer<typeof updateUploaderSchema>;

export const uploaderFilterSchema = z
  .object({
    searchKey: z.string().trim().optional(),
  })
  .strict()
  .partial();

export type IUploaderFilter = z.infer<typeof uploaderFilterSchema>;
