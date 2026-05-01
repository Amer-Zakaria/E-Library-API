import mongoose from "mongoose";
import extractErrorMessagesMongoose from "./extractErrorMessagesMongoose.js";
import { logger } from "../index.js";

interface IErrorStrcture {
  code: number;
  message?: string;
  validation?: object;
  stack: string;
}

export default function ConstructDBHelperExpectedError(
  code: number,
  error: mongoose.Error.ValidationError | object | string
) {
  const errorStrcture: IErrorStrcture = {
    code,
    stack:
      (error as mongoose.Error.ValidationError).stack ||
      "ConstructDBHelperExpectedError",
  };
  if (error instanceof mongoose.Error.ValidationError) {
    errorStrcture.validation = extractErrorMessagesMongoose(error);
    logger.error(`expectedMongoError: ${JSON.stringify(errorStrcture)}`);
  } else if (typeof error === "object") errorStrcture.validation = error;
  else errorStrcture.message = error;

  return Promise.reject(errorStrcture);
}
