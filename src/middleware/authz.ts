import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function authz(req: Request, res: Response, next: NextFunction): any {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_PRIVATE_TOKEN as string,
    ) as any;
    res.locals.username = decoded.username;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}
