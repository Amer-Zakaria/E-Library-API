import type { Request } from "express";
import { FileUtils } from "./file.utils.js";
import { UPLOAD_CONFIG } from "./upload.config.js";
import type { FieldConfig } from "./upload.types.js";

export class FileUpdateService {
  constructor(private endpoint: string, private fileUtils: FileUtils) {}

  // Process file updates: handle deletions and new uploads
  public async processFilesUpdate(
    req: Request,
    existingEntity: any
  ): Promise<{ [fieldName: string]: string | string[] | null }> {
    // Get all field names from config
    const endpointConfig = UPLOAD_CONFIG[this.endpoint];
    if (!endpointConfig) {
      throw new Error(
        `No upload configuration found for endpoint: ${this.endpoint}`
      );
    }

    const result: { [fieldName: string]: string | string[] | null } = {};
    // Populate the result with existing file keys
    Object.keys(endpointConfig).forEach((key) => {
      if (key in existingEntity) {
        result[key] = existingEntity[key];
      }
    });

    const allOperations: Promise<any>[] = [];
    const keysToDelete: string[] = [];

    // Process each configured field
    for (const [fieldName, fieldConfig] of Object.entries(endpointConfig)) {
      const deletionKey = `deleted${this.capitalizeFirst(fieldName)}`;
      const deletedFiles = req.body[deletionKey];
      const newFiles = req.files?.[fieldName];

      // Handle deletions
      if (deletedFiles) {
        const deletionKeys = this.handleFieldDeletions(
          deletedFiles,
          fieldName,
          result,
          fieldConfig
        );
        keysToDelete.push(...deletionKeys);
      }

      // Handle new uploads
      if (newFiles && newFiles.length > 0) {
        const uploadOperation = this.handleFieldUploads(
          newFiles,
          fieldName,
          req.id!,
          result,
          fieldConfig,
          req
        );
        allOperations.push(uploadOperation);
      }
    }

    if (keysToDelete.length > 0) {
      allOperations.push(this.fileUtils.bulkDeleteByKeys(keysToDelete));
    }

    // Execute all AWS operations in parallel
    await Promise.all(allOperations);

    return result;
  }

  // Handle deletions for a specific field
  private handleFieldDeletions(
    deletedFiles: string | string[],
    fieldName: string,
    result: { [fieldName: string]: string | string[] | null },
    fieldConfig: FieldConfig
  ): string[] {
    const keysToDelete: string[] = [];

    if (fieldConfig.maxCount === 1) {
      // Single file field
      if (typeof deletedFiles === "string") {
        keysToDelete.push(deletedFiles);
        result[fieldName] = null;
      }
    } else {
      // Multiple file field
      const deletedArray = Array.isArray(deletedFiles)
        ? deletedFiles
        : [deletedFiles];
      const currentFiles = (result[fieldName] as string[]) || [];

      keysToDelete.push(...deletedArray);

      // Remove from result array
      result[fieldName] = currentFiles.filter(
        (key) => !deletedArray.includes(key)
      );
    }

    return keysToDelete;
  }

  // Handle uploads for a specific field
  private async handleFieldUploads(
    newFiles: Express.Multer.File[],
    fieldName: string,
    entityId: string,
    result: { [fieldName: string]: string | string[] | null },
    fieldConfig: FieldConfig,
    req: Request
  ): Promise<void> {
    // Respect maxCount
    const filesToUpload = newFiles.slice(0, fieldConfig.maxCount);

    // Upload files in parallel
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

    if (fieldConfig.maxCount === 1) {
      // Single file - replace existing
      result[fieldName] = uploadedKeys[0];
    } else {
      // Multiple files - append to existing (after deletions)
      const currentFiles = (result[fieldName] as string[]) || [];
      result[fieldName] = [...currentFiles, ...uploadedKeys];
    }
  }

  // Helper to capitalize first letter
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
