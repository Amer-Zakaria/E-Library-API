import { Schema, isValidObjectId, model } from "mongoose";
import type IProjectSchema from "../Interfaces/IProjectSchema.js";
import type {
  ILocation,
  IPaymentPlan,
  IPaymentPlanDetails,
  IUnitType,
} from "../Interfaces/IProjectSchema.js";
import { z } from "zod";

export const types = ["ready", "off-plan"] as const;

const locationSchema = new Schema<ILocation>(
  {
    city: { type: String, required: true },
    area: { type: String, required: true },
    nearby: [{ type: String }],
  },
  { _id: false }
);

const paymentPlanDetailsSchema = new Schema<IPaymentPlanDetails>(
  {
    down_payment_percent: { type: Number, required: true },
    during_construction_percent: { type: Number, required: true },
    post_handover_percent: { type: Number },
    on_handover_percent: { type: Number },
    monthly_installments: { type: Boolean, required: true },
    total_months: { type: Number },
  },
  { _id: false }
);

const paymentPlanSchema = new Schema<IPaymentPlan>(
  {
    summary: { type: String, required: true },
    details: paymentPlanDetailsSchema,
  },
  { _id: false }
);

const unitTypeSchema = new Schema<IUnitType>({
  type: { type: String, required: true },
  size_range_sqft: { type: String, required: true },
  starting_price: { type: Number, required: true },
});

const projectSchema: Schema = new Schema<IProjectSchema>(
  {
    title: {
      type: String,
      required: true,
      maxLength: 255,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      maxLength: 1000,
      trim: true,
    },
    amenities: {
      type: [String],
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
      maxLength: 1000,
      trim: true,
    },
    handover: {
      type: String,
      required: true,
      maxLength: 255,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      maxLength: 1000,
      trim: true,
    },

    destination: {
      type: Schema.Types.ObjectId,
      ref: "Destinations",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: types,
        message: "{VALUE} is not supported",
      },
    },

    developer: {
      type: Schema.Types.ObjectId,
      ref: "Developers",
      required: true,
    },

    location: { type: locationSchema, required: true },
    payment_plan: { type: paymentPlanSchema, required: true },
    unit_types: [unitTypeSchema],

    mainImage: {
      type: String,
    },
    heroImage: {
      type: String,
    },
    pdf: {
      type: String,
    },
    gallery: {
      type: [String],
    },

    isActive: { type: Boolean, default: true },
  },
  { versionKey: false }
);

projectSchema.pre("save", function (next) {
  // this.updatedAt = Date.now();
  next();
});

export const Project = model<IProjectSchema>("Projects", projectSchema);

const commonSchema = {
  title: z.string().min(1).max(255).trim(),
  summary: z.string().min(1).max(1000).trim(),
  amenities: z.array(z.string()),
  subtitle: z.string().min(1).max(1000).trim(),
  desc: z.string().min(1).max(1000).trim(),
  handover: z.string().min(1).max(255).trim(),

  type: z.enum(types).default("off-plan"),

  destination: z.string().min(1, "Destination is required"),
  developer: z.string().min(1, "Developer is required"),

  location: z.object({
    city: z.string().min(1),
    area: z.string().min(1),
    nearby: z.array(z.string()).optional().default([]),
  }),

  payment_plan: z.object({
    summary: z.string().min(1),
    details: z.object({
      down_payment_percent: z.number(),
      during_construction_percent: z.number(),
      post_handover_percent: z.number().optional(),
      on_handover_percent: z.number().optional(),
      monthly_installments: z.boolean(),
      total_months: z.number().optional(),
    }),
  }),

  unit_types: z
    .array(
      z.object({
        type: z.string().min(1),
        size_range_sqft: z.string().min(1),
        starting_price: z.number(),
      })
    )
    .optional()
    .default([]),
};

export const createProjectSchema = z
  .object({
    ...commonSchema,
  })
  .strict();

export const updateProjectSchema = z
  .object({
    ...commonSchema,

    deletedMainImage: z.string().trim().optional(),
    deletedHeroImage: z.string().trim().optional(),
    deletedPdf: z.string().trim().optional(),
    deletedGallery: z.array(z.string().trim()).optional(),
  })
  .strict();

export const projectFilterSchema = z
  .object({
    types: z.array(z.enum(types)),
    developer: z.string().refine((val) => isValidObjectId(val), {
      message: "Invalid MongoDB ObjectId",
    }),
    destination: z.string().refine((val) => isValidObjectId(val), {
      message: "Invalid MongoDB ObjectId",
    }),
  })
  .strict()
  .partial();

/* Extracting typescript types from schemas  */
export type ICreateProject = z.infer<typeof createProjectSchema>;
export type IUpdateProject = z.infer<typeof updateProjectSchema>;
export type IProjectFilter = z.infer<typeof projectFilterSchema>;
