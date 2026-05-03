import { Document } from "mongoose";

export default interface IUploaderSchema extends Document {
  _id: string;
  username: string;
  password: string;
}
