import { Document } from "mongoose";

export default interface IDestinationSchema extends Document {
  _id: string;
  name: string;
  from: number;
  img: string;
}
