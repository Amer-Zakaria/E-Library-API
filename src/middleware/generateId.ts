import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export default (req: Request, res: Response, next: NextFunction) => {
  const id = new mongoose.Types.ObjectId().toString();
  req.id = id;

  next();
};
