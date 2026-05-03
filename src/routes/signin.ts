import express from "express";
import bcrypt from "bcrypt";
import { stackDecision } from "../utils/catchDBHelperError.js";
import validateReq from "../middleware/validateReq.js";
import { z } from "zod";
import type IUserCred from "../Interfaces/IUserCred.js";
import { Uploader } from "../models/uploader.js";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

export const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 10,
  message: {
    success: false,
    message:
      "The maximum number of signing-in tries has been exceeded. Try again later",
  },
});

router.post(
  "/",
  authLimiter,
  validateReq(
    z.object({
      username: z.string().min(3).max(255),
      password: z.string().min(8).max(255),
    }),
    "body",
  ),
  async (req, res) => {
    const userCred = res.locals.data as IUserCred;
    let hashedPassword = "";

    if (userCred.username === "admin") {
      // Admin logic
      const isValidePassword = await bcrypt.compare(
        userCred.password,
        process.env.PASS as string,
      );
      if (!isValidePassword) {
        res.status(400).json({
          message: "Incorrect Password",
          ...stackDecision(),
        });
        return;
      }
      hashedPassword = process.env.PASS as string;
    } else {
      // Uploader logic
      const uploader = await Uploader.findOne({ username: userCred.username });
      if (!uploader) {
        res.status(400).json({
          message: "Incorrect Username or Password",
          ...stackDecision(),
        });
        return;
      }

      const isValidePassword = await bcrypt.compare(
        userCred.password,
        uploader.password,
      );
      if (!isValidePassword) {
        res.status(400).json({
          message: "Incorrect Username or Password",
          ...stackDecision(),
        });
        return;
      }
      hashedPassword = uploader.password;
    }

    const token = jwt.sign(
      { username: userCred.username },
      process.env.JWT_PRIVATE_TOKEN as string,
      {
        expiresIn: process.env.JWT_TOKEN_EXPIRATION_DURATION as "1 day",
      },
    );

    res.send(token);
  },
);

export default router;
