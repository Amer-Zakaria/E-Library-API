import type { Request, Response, NextFunction } from "express";
import { isErrorWithStack, logger } from "../index.js";
import mongoose from "mongoose";
import catchDBHelperError from "../utils/catchDBHelperError.js";
import ConstructDBHelperExpectedError from "./../utils/ConstructDBHelperExpectedError.js";
import multer from "multer";

export default function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: `${err.message} 
      ${err.code}`,
    });
  }

  if (err instanceof mongoose.Error.ValidationError)
    return ConstructDBHelperExpectedError(400, err).catch(
      catchDBHelperError(res)
    );

  logger.error(`unexpectedError: ${err.message}`, { stack: err.stack });

  res.status(500).send({
    message: "Something faild.",
    ...(isErrorWithStack && {
      err: { message: err.message, stack: err.stack },
    }),
  });
}
