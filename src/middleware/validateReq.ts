import type { NextFunction, Request, Response } from "express";
import { isErrorWithStack } from "../index.js";
import { z } from "zod";

export default function validateReq(
  schema: z.ZodObject<any>,
  part: "body" | "query"
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    const result = schema.safeParse(req[part]);
    if (result.error) {
      return res.status(400).json({
        message: result.error.issues[0]?.message || "Invalid input.",
        // validation: extractErrorMessagesZod(result.error),
        ...(isErrorWithStack && { stack: result.error.stack }),
      });
    }

    if (part === "body") res.locals.data = result.data;

    next();
  };
}
