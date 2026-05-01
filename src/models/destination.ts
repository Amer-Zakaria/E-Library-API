import { Schema, model } from "mongoose";
import type IDestinationSchema from "../Interfaces/IDestinationSchema.js";
import { z } from "zod";

const destinationSchema = new Schema<IDestinationSchema>(
  {
    name: { type: String, required: true },

    from: { type: Number, required: true },

    img: {
      type: String,
    },
  },
  { versionKey: false }
);

export const Destination = model<IDestinationSchema>(
  "Destinations",
  destinationSchema
);

const commonSchema = {
  name: z.string().min(1).max(255).trim(),
  from: z.number(),
};

export const createDestinationSchema = z
  .object({
    ...commonSchema,
  })
  .strict();

export const updateDestinationSchema = z
  .object({
    ...commonSchema,

    deletedImg: z.string().trim().optional(),
  })
  .strict();

/* Extracting typescript types from schemas  */
export type ICreateDestination = z.infer<typeof createDestinationSchema>;
export type IUpdateDestination = z.infer<typeof updateDestinationSchema>;
