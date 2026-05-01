import multer, { MulterError } from "multer";
import type { FileFilterCallback } from "multer";
import type { Request } from "express";
import { getFieldConfig } from "./upload.config.js";
import { FileUtils } from "./file.utils.js";

export class FileStorageService {
  constructor(private endpoint: string, private fileUtils: FileUtils) {}

  // Process entire req.files object like multer
  public async processFiles(
    req: Request
  ): Promise<{ [fieldName: string]: string | string[] }> {
    const files = req.files!;
    const entityId = req.id!;
    const result: { [fieldName: string]: string | string[] } = {};

    // Process each field (gallery, mainImage, pdf, etc.)
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (!fileArray || fileArray.length === 0) continue;

      const fieldConfig = getFieldConfig(this.endpoint, fieldName);

      // Respect maxCount - only take the allowed number of files
      const filesToUpload = fileArray.slice(0, fieldConfig.maxCount);

      // Upload all files for this field in parallel
      const uploadPromises = filesToUpload.map((file) =>
        this.fileUtils.uploadFile(
          file.buffer,
          entityId,
          file.fieldname,
          file.originalname,
          file.mimetype,
          req
        )
      );

      const uploadedKeys = await Promise.all(uploadPromises);

      // Return single string for single files, array for multiple files
      if (fieldConfig.maxCount === 1) {
        result[fieldName] = uploadedKeys[0];
      } else {
        result[fieldName] = uploadedKeys;
      }
    }

    return result;
  }

  public createFileFilter(): (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => void {
    return (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback
    ) => {
      try {
        const endpoint = this.endpoint;
        const fieldConfig = getFieldConfig(endpoint, file.fieldname);

        if (!fieldConfig.allowedMimes.includes(file.mimetype)) {
          const error = new MulterError("LIMIT_UNEXPECTED_FILE");
          error.message = `File type ${file.mimetype} not allowed for field ${file.fieldname}`;
          return cb(error);
        }

        cb(null, true);
      } catch (error) {
        cb(error as Error);
      }
    };
  }

  public createUploadMiddleware(): multer.Multer {
    const storage = multer.memoryStorage();

    return multer({
      storage: storage,
      fileFilter: this.createFileFilter(),
      limits: {
        fileSize: 200 * 1024 * 1024, // Global max, individual limits checked in fileFilter
        files: 30, // Maximum number of files
        fields: 50, // Maximum number of non-file fields
      },
    });
  }
}
