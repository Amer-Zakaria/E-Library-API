import express from "express";
import type { Request, Response } from "express";
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../DB Helpers/destinations.js";
import paginationValidation from "../utils/paginationValidation.js";
import { authz } from "../middleware/authz.js";
import { Destination, updateDestinationSchema } from "../models/destination.js";
import validateReq from "../middleware/validateReq.js";
import validateUniqueness from "../middleware/validateUniqueness.js";
import { createDestinationSchema } from "../models/destination.js";
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

const endpoint = "destinations";

const router = express.Router();
const dynamicUpload = createDynamicUploadMiddleware(endpoint);
const cleanUpListener = createCleanupMiddleware(endpoint);

router.get(
  "/",
  [validateReq(paginationValidation, "query")],
  async (req: Request, res: Response) => {
    const destinations = await getDestinations(req.query);
    res.json(destinations);
  }
);

router.get(
  "/:id",
  [validateObjectId(Destination)],
  async (req: Request, res: Response) => {
    const result = await res.locals.document;
    res.json(result);
  }
);

router.post(
  "/",
  [
    authz,
    generateId,
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(createDestinationSchema, "body"),
    validateUniqueness("name", Destination),
  ],
  async (req: Request, res: Response) => {
    const result = await handleFilesProcessing(endpoint, req);

    const createdDestination = await createDestination({
      _id: req.id,
      ...res.locals.data,
      ...result,
    });

    res.status(201).json(createdDestination);
  }
);

router.put(
  "/:id",
  [
    authz,
    validateObjectId(Destination),
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(updateDestinationSchema, "body"),
    validateUniqueness("name", Destination),
  ],
  async (req: Request, res: Response) => {
    const existingDestination = res.locals.document;

    // Handle file deletions and updates
    const fileUpdates = await handleFilesUpdateProcessing(
      endpoint,
      req,
      existingDestination
    );

    const updatedDestination = await updateDestination(req.id!, {
      ...res.locals.data,
      ...fileUpdates,
    });

    res.status(201).json(updatedDestination);
  }
);

router.put(
  "/",
  [authz, validateObjectId(Destination)],
  async (req: Request, res: Response) => {
    const updatedDestination = await updateDestination(
      req.id!,
      res.locals.data
    );

    res.status(200).json(updatedDestination);
  }
);

router.delete(
  "/:id",
  [authz, validateObjectId(Destination)],
  async (req: Request, res: Response) => {
    await handleBulkDeleteById(endpoint, req.id);

    const deletedDestination = await deleteDestination(req.id!);

    res.status(200).json(deletedDestination);
  }
);

export default router;
