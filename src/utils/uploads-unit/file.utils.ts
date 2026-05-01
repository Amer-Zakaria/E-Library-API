import type { Request } from "express";
import * as path from "path";
import * as fs from "fs/promises";
import { getFieldConfig } from "./upload.config.js";

export class FileUtils {
  constructor(
    private endpoint: string,
    private uploadsBasePath: string,
    private publicPath: string,
  ) {}

  public async uploadFile(
    fileBuffer: Buffer,
    entityId: string,
    fieldName: string,
    originalFileName: string,
    mimetype: string,
    req: Request,
  ) {
    const fieldConfig = getFieldConfig(this.endpoint, fieldName);
    const uniqueFileName = this.generateUniqueFilename(originalFileName);

    const relativePath = this.buildStructuredKey(
      entityId,
      fieldConfig.folderName,
      uniqueFileName,
    );

    const absolutePath = path.join(this.publicPath, relativePath);

    // Make sure the directory exists before writing
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, fileBuffer);

    this.trackUploadedFile(req, relativePath);

    return relativePath;
  }

  public generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);

    return `${timestamp}-${randomStr}-${name}${ext}`;
  }

  public async deleteFile(key: string) {
    const absolutePath = path.join(this.publicPath, key);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  public async bulkDeleteById(id: string) {
    const relativeFolder = [this.uploadsBasePath, this.endpoint, id]
      .filter(Boolean)
      .join("/");
    const absoluteFolder = path.join(this.publicPath, relativeFolder);

    try {
      await fs.rm(absoluteFolder, { recursive: true, force: true });
    } catch (error) {
      // Folder might not exist
    }
  }

  public async bulkDeleteByKeys(keys: string[]) {
    const deletions = keys.map((key) => this.deleteFile(key));
    await Promise.all(deletions);
  }

  private trackUploadedFile(req: Request, key: string): void {
    if (!req.uploadedFiles) {
      req.uploadedFiles = [];
    }
    req.uploadedFiles.push(key);
  }

  private buildStructuredKey(
    entityId: string,
    folderName: string,
    fileName: string,
  ): string {
    // Build path: [uploadsBasePath/]endpoint/entityId/folderName/fileName
    const pathParts = [];

    // Add root path if in development
    if (this.uploadsBasePath) {
      pathParts.push(this.uploadsBasePath);
    }

    pathParts.push(this.endpoint, entityId, folderName, fileName);

    return pathParts.join("/");
  }
}
