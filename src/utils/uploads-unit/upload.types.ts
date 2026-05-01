declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    files?: {
      [field: string]: Express.Multer.File[];
    };
    uploadedFiles?: string[];
  }
}

// Configuration types
export interface FieldConfig {
  folderName: string;
  allowedMimes: string[];
  maxCount: number;
  maxSize?: number; // in bytes
}

export interface EndpointConfig {
  [fieldName: string]: FieldConfig;
}

export interface UploadConfig {
  [endpoint: string]: EndpointConfig;
}
