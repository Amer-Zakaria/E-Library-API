import { Document, Types } from "mongoose";

export default interface IActivitySchema extends Document {
  _id: Types.ObjectId;
  type: "view" | "download" | "session";
  browserId?: string;
  contentId?: Types.ObjectId;
  createdAt: Date;
}
