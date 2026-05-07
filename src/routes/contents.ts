import express from "express";
import type { Request, Response } from "express";
import {
  getContents,
  createContent,
  updateIsActive,
  deleteContent,
  updateContent,
} from "../DB Helpers/contents.js";
import {
  createContentSchema,
  contentFilterSchema,
  updateContentSchema,
  Content,
} from "../models/content.js";
import paginationValidation from "../utils/paginationValidation.js";
import { authz } from "../middleware/authz.js";
import validateObjectId from "../middleware/validateObjectId.js";
import validateReq from "../middleware/validateReq.js";
import validateUniqueness from "../middleware/validateUniqueness.js";
import parseJsonDataField from "../middleware/parseJsonDataField.js";
import generateId from "../middleware/generateId.js";
import {
  createCleanupMiddleware,
  createDynamicUploadMiddleware,
  handleBulkDeleteById,
  handleFilesProcessing,
  handleFilesUpdateProcessing,
} from "../utils/uploads-unit/index.js";
import trackViewMiddleware from "../middleware/trackViews.js";

const endpoint = "contents";

export const router = express.Router();
const dynamicUpload = createDynamicUploadMiddleware(endpoint);
const cleanUpListener = createCleanupMiddleware(endpoint);

router.post(
  "/get",
  [
    validateReq(paginationValidation, "query"),
    validateReq(contentFilterSchema, "body"),
  ],
  async (req: Request, res: Response) => {
    const result = await getContents(
      req.get("Origin")!,
      req.query,
      res.locals.data,
    );
    res.json(result);
  },
);

router.get(
  "/:id",
  [validateObjectId(Content), trackViewMiddleware],
  async (req: Request, res: Response) => {
    const result = await res.locals.document.populate("category");
    res.json(result);
  },
);

router.post(
  "/",
  [
    authz,
    generateId,
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(createContentSchema, "body"),
    validateUniqueness("title", Content),
  ],
  async (req: Request, res: Response) => {
    const result = await handleFilesProcessing(endpoint, req);

    const createdContent = await createContent({
      _id: req.id,
      uploader: res.locals.username,
      ...res.locals.data,
      ...result,
    });

    res.status(201).json(createdContent);
  },
);

router.put(
  "/:id",
  [
    authz,
    validateObjectId(Content),
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(updateContentSchema, "body"),
    validateUniqueness("title", Content),
  ],
  async (req: Request, res: Response) => {
    const existingContent = res.locals.document;

    // Handle file deletions and updates
    const fileUpdates = await handleFilesUpdateProcessing(
      endpoint,
      req,
      existingContent,
    );

    const updatedContent = await updateContent(req.params.id, {
      ...res.locals.data,
      ...fileUpdates,
    });

    res.json(updatedContent);
  },
);

router.patch(
  "/:isActive/:id",
  [authz, validateObjectId(Content)],
  async (req: Request, res: Response) => {
    const isActive = req.params.isActive === "true";
    const id = req.params.id;

    const updatedContent = await updateIsActive(id, isActive);

    if (!updatedContent) return;

    res.json(updatedContent);
  },
);

router.delete(
  "/:id",
  [authz, validateObjectId(Content)],
  async (req: Request, res: Response) => {
    await handleBulkDeleteById(endpoint, req.params.id);
    const deletedContent = await deleteContent(res.locals.document);

    res.json(deletedContent);
  },
);

export default router;
