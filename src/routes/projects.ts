import express from "express";
import type { Request, Response } from "express";
import {
  getProjects,
  createProject,
  updateIsActive,
  deleteProject,
  updateProject,
} from "../DB Helpers/projects.js";
import {
  createProjectSchema,
  projectFilterSchema,
  updateProjectSchema,
} from "../models/project.js";
import paginationValidation from "../utils/paginationValidation.js";
import { authz } from "../middleware/authz.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { Project } from "../models/project.js";
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

const endpoint = "projects";

export const router = express.Router();
const dynamicUpload = createDynamicUploadMiddleware(endpoint);
const cleanUpListener = createCleanupMiddleware(endpoint);

router.post(
  "/get",
  [
    validateReq(paginationValidation, "query"),
    validateReq(projectFilterSchema, "body"),
  ],
  async (req: Request, res: Response) => {
    const projects = await getProjects(
      req.get("Origin")!,
      req.query,
      res.locals.data
    );
    res.json(projects);
  }
);

router.get(
  "/:id",
  [validateObjectId(Project)],
  async (req: Request, res: Response) => {
    const result = await res.locals.document.populate([
      "developer",
      "destination",
    ]);
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
    validateReq(createProjectSchema, "body"),
    validateUniqueness("title", Project),
  ],
  async (req: Request, res: Response) => {
    const result = await handleFilesProcessing(endpoint, req);

    const createdProject = await createProject({
      _id: req.id,
      ...res.locals.data,
      ...result,
    });

    res.status(201).json(createdProject);
  }
);

router.put(
  "/:id",
  [
    authz,
    validateObjectId(Project),
    cleanUpListener,
    dynamicUpload,
    parseJsonDataField,
    validateReq(updateProjectSchema, "body"),
    validateUniqueness("title", Project),
  ],
  async (req: Request, res: Response) => {
    const existingProject = res.locals.document;

    // Handle file deletions and updates
    const fileUpdates = await handleFilesUpdateProcessing(
      endpoint,
      req,
      existingProject
    );

    const updatedProject = await updateProject(req.params.id, {
      ...res.locals.data,
      ...fileUpdates,
    });

    res.json(updatedProject);
  }
);

router.patch(
  "/:isActive/:id",
  [authz, validateObjectId(Project)],
  async (req: Request, res: Response) => {
    const isActive = req.params.isActive === "true"; //convet to boolean
    const id = req.params.id;

    const updatedProject = await updateIsActive(id, isActive);

    if (!updatedProject) return;

    res.json(updatedProject);
  }
);

router.delete(
  "/:id",
  [authz, validateObjectId(Project)],
  async (req: Request, res: Response) => {
    await handleBulkDeleteById(endpoint, req.id);
    const deletedProject = await deleteProject(res.locals.document);

    res.json(deletedProject);
  }
);

export default router;
