import { Document } from "mongoose";

export default interface ICategorySchema extends Document {
  _id: string;
  name: string;
  description?: string;
  img?: string;
}
