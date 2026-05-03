import { Document, Schema } from "mongoose";

export default interface IContentSchema extends Document {
  title: string;
  author: string;
  category: Schema.Types.ObjectId;
  rating: number;
  description: string;

  mainImage?: string; // Cover image
  pdf?: string; // For books, research, articles
  audio?: string; // For audio files
  gallery?: string[];

  uploader: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
