import type { Request, Response, NextFunction } from "express";
import { getFieldsConfig } from "./upload.config.js";
import { FileStorageService } from "./file-storage.service.js";
import { FileUpdateService } from "./file-update.service.js";
import { FileUtils } from "./file.utils.js";
import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

const region = process.env.AWS_BUCKET_REGION!;
const accessKeyId = process.env.AWS_ACCESS_KEY!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const basePath = process.env.NODE_ENV === "production" ? "" : "experimental";

export class FileUploadService {
  private static instances: Map<string, FileUploadService> = new Map();
  private readonly s3Client: S3Client;
  private readonly uploadsBasePath: string;
  private readonly endpoint: string;

  private fileUtils: FileUtils;
  private storageService: FileStorageService;
  private updateService: FileUpdateService;

  private constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.uploadsBasePath = basePath;

    // Init s3 client instance
    const s3Config: S3ClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };
    const s3Client = new S3Client(s3Config);
    this.s3Client = s3Client;

    // Initialize all services
    this.fileUtils = new FileUtils(
      endpoint,
      this.uploadsBasePath,
      this.s3Client,
    );
    this.storageService = new FileStorageService(endpoint, this.fileUtils);
    this.updateService = new FileUpdateService(endpoint, this.fileUtils);
  }

  public static getInstance(endpoint: string): FileUploadService {
    if (!FileUploadService.instances.has(endpoint)) {
      FileUploadService.instances.set(
        endpoint,
        new FileUploadService(endpoint),
      );
    }
    return FileUploadService.instances.get(endpoint)!;
  }

  // Method to create dynamic fields middleware based on endpoint
  public createDynamicFieldsMiddleware(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const endpoint = this.endpoint;
      if (!endpoint) {
        return next(new Error("Unable to extract endpoint from request"));
      }

      const fieldsConfig = getFieldsConfig(endpoint);

      // skip if no fields
      if (fieldsConfig.length === 0) {
        return next();
      }

      // Create the fields middleware dynamically
      const fieldsMiddleware = this.storageService
        .createUploadMiddleware()
        .fields(fieldsConfig);

      // Execute the dynamically created middleware
      fieldsMiddleware(req, res, next);
    };
  }

  // Create cleanup middleware for update operations
  public createCleanupMiddleware(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Initialize uploaded files array for new uploads
      req.uploadedFiles = [];

      res.on("finish", () => {
        if (res.statusCode >= 400) {
          // Only cleanup newly uploaded files if request failed
          if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            this.fileUtils.bulkDeleteByKeys(req.uploadedFiles);
          }
        }
      });

      next();
    };
  }

  /* Delegations */
  async processFiles(req: Request) {
    return this.storageService.processFiles(req);
  }
  async processFilesUpdate(req: Request, existingEntity: any) {
    return this.updateService.processFilesUpdate(req, existingEntity);
  }
  async bulkDeleteById(id: string) {
    return this.fileUtils.bulkDeleteById(id);
  }
}

// Factory function to create dynamic fields middleware
export const createDynamicUploadMiddleware = (
  endpoint: string,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const fileUploadService = FileUploadService.getInstance(endpoint);
  return fileUploadService.createDynamicFieldsMiddleware();
};

// Factory functions for cleanup middleware
export const createCleanupMiddleware = (
  endpoint: string,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const fileUploadService = FileUploadService.getInstance(endpoint);
  return fileUploadService.createCleanupMiddleware();
};

// Factory function to handle file updates
export const handleFilesProcessing = async (
  endpoint: string,
  req: Request,
): Promise<any> => {
  const fileUploadService = FileUploadService.getInstance(endpoint);
  return fileUploadService.processFiles(req);
};

// Factory function to handle file updates
export const handleFilesUpdateProcessing = async (
  endpoint: string,
  req: Request,
  existingEntity: any,
): Promise<any> => {
  const fileUploadService = FileUploadService.getInstance(endpoint);
  return fileUploadService.processFilesUpdate(req, existingEntity);
};

// Factory function to handle dir deletion
export const handleBulkDeleteById = async (
  endpoint: string,
  existingEntity: any,
): Promise<any> => {
  const fileUploadService = FileUploadService.getInstance(endpoint);
  return fileUploadService.bulkDeleteById(existingEntity);
};
