import type { Request, Response, NextFunction } from "express";

export default function parseJsonDataField(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body.data) {
    try {
      const parsed = JSON.parse(req.body.data);

      req.body = parsed;
    } catch (err) {
      return next(new Error("Invalid JSON in data field"));
    }
  }
  next();
}
