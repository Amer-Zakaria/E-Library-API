import express from "express";
import type { Request, Response } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../DB Helpers/categories.js";
import paginationValidation from "../utils/paginationValidation.js";
import { authz } from "../middleware/authz.js";
import { Category, updateCategorySchema } from "../models/category.js";
import validateReq from "../middleware/validateReq.js";
import validateUniqueness from "../middleware/validateUniqueness.js";
import { createCategorySchema } from "../models/category.js";
import validateObjectId from "../middleware/validateObjectId.js";
import {
  createCleanupMiddleware,
  createDynamicUploadMiddleware,
  handleBulkDeleteById,
  handleFilesProcessing,
  handleFilesUpdateProcessing,
} from "../utils/uploads-unit/index.js";
import generateId from "../middleware/generateId.js";
import parseJsonDataField from "../middleware/parseJsonDataField.js";

const endpoint = "categories";

const router = express.Router();
const dynamicUpload = createDynamicUploadMiddleware(endpoint);
const cleanUpListener = createCleanupMiddleware(endpoint);

router.get(
  "/",
  [validateReq(paginationValidation, "query")],
  async (req: Request, res: Response) => {
    const categories = await getCategories(req.query);
    res.json(categories);
  },
);

router.get(
  "/:id",
  [validateObjectId(Category)],
  async (req: Request, res: Response) => {
    const result = await res.locals.document;
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
    validateReq(createCategorySchema, "body"),
    validateUniqueness("name", Category),
  ],
  async (req: Request, res: Response) => {
    const result = await handleFilesProcessing(endpoint, req);

    const createdCategory = await createCategory({
      _id: req.id,
      ...res.locals.data,
      ...result,
    });

    res.status(201).json(createdCategory);
  },
);

router.put(
  "/:id",
  [
    authz,
    validateObjectId(Category),
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(updateCategorySchema, "body"),
    validateUniqueness("name", Category),
  ],
  async (req: Request, res: Response) => {
    const existingCategory = res.locals.document;

    // Handle file deletions and updates
    const fileUpdates = await handleFilesUpdateProcessing(
      endpoint,
      req,
      existingCategory,
    );

    const updatedCategory = await updateCategory(req.params.id, {
      ...res.locals.data,
      ...fileUpdates,
    });

    res.status(200).json(updatedCategory);
  },
);

router.delete(
  "/:id",
  [authz, validateObjectId(Category)],
  async (req: Request, res: Response) => {
    await handleBulkDeleteById(endpoint, req.params.id);

    const deletedCategory = await deleteCategory(req.params.id);

    res.status(200).json(deletedCategory);
  },
);

export default router;
