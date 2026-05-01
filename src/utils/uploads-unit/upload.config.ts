import { logger } from "../../index.js";
import type { FieldConfig, UploadConfig } from "./upload.types.js";

const allowedImages = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const UPLOAD_CONFIG: UploadConfig = {
  projects: {
    mainImage: {
      folderName: "mainImage",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
    heroImage: {
      folderName: "heroImage",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
    gallery: {
      folderName: "gallery",
      allowedMimes: allowedImages,
      maxCount: 20,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
    pdf: {
      folderName: "pdf",
      allowedMimes: ["application/pdf"],
      maxCount: 1,
      maxSize: 100 * 1024 * 1024, // 100 MB
    },
  },
  resales: {
    mainImage: {
      folderName: "mainImage",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
    gallery: {
      folderName: "gallery",
      allowedMimes: allowedImages,
      maxCount: 20,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  destinations: {
    img: {
      folderName: "img",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  services: {
    img: {
      folderName: "img",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  articles: {
    img: {
      folderName: "img",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  customerReviews: {
    img: {
      folderName: "img",
      allowedMimes: allowedImages,
      maxCount: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  },
};

// Default configuration for unknown endpoints/fields
export const DEFAULT_CONFIG: FieldConfig = {
  folderName: "others",
  allowedMimes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  maxCount: 50,
  maxSize: 200 * 1024 * 1024, // 200 MB
};

export function getFieldConfig(
  endpoint: string,
  fieldName: string
): FieldConfig {
  return UPLOAD_CONFIG[endpoint]?.[fieldName] || DEFAULT_CONFIG;
}

// Method to get fields configuration for a specific endpoint
export function getFieldsConfig(
  endpoint: string
): Array<{ name: string; maxCount: number }> {
  const endpointConfig = UPLOAD_CONFIG[endpoint];

  if (!endpointConfig) {
    logger.error(`No upload configuration found for endpoint: ${endpoint}`);
    return [];
  }

  return Object.entries(endpointConfig).map(([fieldName, config]) => ({
    name: fieldName,
    maxCount: config.maxCount || DEFAULT_CONFIG.maxCount!,
  }));
}
