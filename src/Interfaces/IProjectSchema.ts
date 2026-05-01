import { Schema, Document } from "mongoose";
import { types } from "../models/project.js";

export interface ILocation {
  city: string;
  area: string;
  nearby: string[];
}

export interface IDeveloper {
  name: string;
  bio: string;
  past_projects: string[];
}

export interface IPaymentPlanDetails {
  down_payment_percent: number;
  during_construction_percent: number;
  post_handover_percent?: number;
  on_handover_percent?: number;
  monthly_installments: boolean;
  total_months: number;
}

export interface IPaymentPlan {
  summary: string;
  details: IPaymentPlanDetails;
}

export interface IUnitType {
  _id?: Schema.Types.ObjectId;
  type: string;
  size_range_sqft: string;
  starting_price: number;
}

export default interface IProjectSchema extends Document {
  summary: string;
  desc: string;
  amenities: string[];
  isActive: Boolean;

  developer: Schema.Types.ObjectId;
  destination: Schema.Types.ObjectId;
  location: ILocation;
  type?: (typeof types)[number];
  title: string;
  subtitle: string;
  handover: string;
  payment_plan: IPaymentPlan;
  unit_types: IUnitType[];

  mainImage: string;
  heroImage: string;
  pdf: string;
  gallery: string[];

  createdAt?: string;
  updatedAt?: string;
}
