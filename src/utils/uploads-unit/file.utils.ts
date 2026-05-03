import type { Request } from "express";
import * as path from "path";
import {
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getFieldConfig } from "./upload.config.js";

const bucketName = process.env.AWS_BUCKET_NAME!;

export class FileUtils {
  constructor(
    private endpoint: string,
    private uploadsBasePath: string,
    private s3Client: S3Client,
  ) {}

  public async uploadFile(
    fileBuffer: Buffer,
    entityId: string,
    fieldName: string,
    originalFileName: string,
    mimetype: string,
    req: Request,
  ) {
    // Get field configuration to determine folder structure
    const fieldConfig = getFieldConfig(this.endpoint, fieldName);

    // Generate unique filename (same logic as multer was using)
    const uniqueFileName = this.generateUniqueFilename(originalFileName);

    // Build structured key path: experimental/projects/123/mainImage/timestamp-random-filename.jpg
    const key = this.buildStructuredKey(
      entityId,
      fieldConfig.folderName,
      uniqueFileName,
    );

    const uploadParams: PutObjectCommandInput = {
      Bucket: bucketName,
      Body: fileBuffer,
      Key: key,
      ContentType: mimetype,
    };

    // Upload to S3
    await this.s3Client.send(new PutObjectCommand(uploadParams));

    this.trackUploadedFile(req, key);

    // Return the full key for storage in database
    return key;
  }

  public generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);

    return `${timestamp}-${randomStr}-${name}${ext}`;
  }

  public deleteFile(key: string) {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    return this.s3Client.send(new DeleteObjectCommand(deleteParams));
  }

  public async bulkDeleteById(id: string) {
    const objects = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${[this.uploadsBasePath, this.endpoint, id].join("/")}/`,
      }),
    );
    if (objects.Contents?.length) {
      return this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objects.Contents.map(({ Key }) => ({ Key })) },
        }),
      );
    }
  }

  public async bulkDeleteByKeys(keys: string[]) {
    return this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
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
