import bcrypt from "bcrypt";
import type IPagination from "../Interfaces/IPagination.js";
import { Uploader } from "../models/uploader.js";
import type { ICreateUploader, IUpdateUploader } from "../models/uploader.js";

import type IUploaderSchema from "../Interfaces/IUploaderSchema.js";

interface IUploaderFilterWithPagination extends IPagination {
  searchKey?: string;
}

export async function getUploaders(
  filtersWithPagination: IUploaderFilterWithPagination,
) {
  let { pageNumber, pageSize, ...filters } = filtersWithPagination;
  pageNumber = +(pageNumber ?? 1);
  pageSize = +(pageSize ?? 10);

  const filterConstructor: any = {};
  if (filters?.searchKey) {
    filterConstructor.username = { $regex: filters.searchKey, $options: "i" };
  }

  const UploadersPromise = Uploader.aggregate([
    { $match: filterConstructor },
    {
      $project: {
        password: 0,
      },
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ]);

  const UploadersCountPromise = Uploader.find().count();

  return Promise.all([UploadersPromise, UploadersCountPromise]).then(
    (result) => ({
      uploaders: result[0],
      paginationInfo: {
        totalItems: result[1],
        totalPages: Math.ceil(result[1] / pageSize),
        pageSize,
        pageNumber,
      },
    }),
  );
}

export async function createUploader(
  createdUploader: ICreateUploader,
): Promise<IUploaderSchema> {
  const salt = await bcrypt.genSalt(10);
  createdUploader.password = await bcrypt.hash(createdUploader.password, salt);

  const uploader = new Uploader(createdUploader);

  const savedUploader = await uploader.save();

  return savedUploader;
}

export async function updateUploader(
  id: string,
  updatedUploader: IUpdateUploader,
): Promise<IUploaderSchema> {
  //GET IT
  const uploader = (await Uploader.findOne({ _id: id }))!;

  //CHANGE IT
  if (updatedUploader.password) {
    const salt = await bcrypt.genSalt(10);
    updatedUploader.password = await bcrypt.hash(
      updatedUploader.password,
      salt,
    );
  }
  uploader.set(updatedUploader);

  //SAVE IT
  const savedUploader = await uploader.save();

  return savedUploader;
}

export async function deleteUploader(id: string) {
  //GET IT
  const uploader = (await Uploader.findOne({ _id: id }))!;

  const result = await uploader.deleteOne();

  return result;
}
