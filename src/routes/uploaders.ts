import express from "express";
import type { Request, Response } from "express";
import {
  getUploaders,
  createUploader,
  deleteUploader,
} from "../DB Helpers/uploaders.js";
import paginationValidation from "../utils/paginationValidation.js";
import { authz } from "../middleware/authz.js";
import { Uploader } from "../models/uploader.js";
import validateReq from "../middleware/validateReq.js";
import validateUniqueness from "../middleware/validateUniqueness.js";
import { createUploaderSchema } from "../models/uploader.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { admin } from "../middleware/admin.js";

const router = express.Router();

router.get(
  "/",
  [validateReq(paginationValidation, "query")],
  async (req: Request, res: Response) => {
    const uploaders = await getUploaders(req.query);
    res.json(uploaders);
  },
);

router.get(
  "/:id",
  [validateObjectId(Uploader)],
  async (req: Request, res: Response) => {
    const result = await res.locals.document;
    res.json(result);
  },
);

router.post(
  "/",
  [
    authz,
    admin,
    validateReq(createUploaderSchema, "body"),
    validateUniqueness("username", Uploader),
  ],
  async (req: Request, res: Response) => {
    const createdUploader = await createUploader(res.locals.data);

    res.status(201).json(createdUploader);
  },
);

router.delete(
  "/:id",
  [authz, admin, validateObjectId(Uploader)],
  async (req: Request, res: Response) => {
    const result = await deleteUploader(req.id!);

    res.status(200).json(result);
  },
);

export default router;
