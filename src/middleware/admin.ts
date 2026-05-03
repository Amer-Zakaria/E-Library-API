import type { Request, Response, NextFunction } from "express";

export function admin(req: Request, res: Response, next: NextFunction): any {
  if (res.locals.username != "admin") {
    return res.status(403).send("Unauthorized access");
  }
  next();
}
