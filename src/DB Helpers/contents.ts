import type IContentSchema from "../Interfaces/IContentSchema.js";
import type IPagination from "../Interfaces/IPagination.js";
import {
  Content,
  type ICreateContent,
  type IContentFilter,
  type IUpdateContent,
} from "../models/content.js";
import ConstructDBHelperExpectedError from "../utils/ConstructDBHelperExpectedError.js";
import type IReturnedList from "../Interfaces/IReturnedList.js";
import { Types } from "mongoose";

export async function getContents(
  reqOrigin: string,
  pagination: IPagination,
  filters?: IContentFilter,
): Promise<IReturnedList<IContentSchema>> {
  const pageNumber = +(pagination.pageNumber ?? 1);
  const pageSize = +(pagination.pageSize ?? 10);

  //Constructing the filter object
  const filterConstructor: any = {};
  if (filters) {
    if (filters.category)
      filterConstructor.category = new Types.ObjectId(filters.category);
    if (filters.rating) filterConstructor.rating = filters.rating;
    if (filters.searchKey)
      filterConstructor.$text = { $search: filters.searchKey };

    if (reqOrigin === process.env.CUSTOMER_UI_URL)
      filterConstructor.isActive = true;
  }

  const ContentsPromise = Content.aggregate([
    { $match: filterConstructor },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    {
      $project: {
        title: 1,
        author: 1,
        type: 1,
        mainImage: 1,
        gallery: 1,
        audio: 1,
        pdf: 1,
        isActive: 1,
        rating: 1,
        description: 1,
        category: {
          $arrayElemAt: ["$categoryInfo.name", 0],
        },
        uploader: 1,
        createdAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ])
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const ContentsCountPromise = Content.find(filterConstructor).count();

  return Promise.all([ContentsPromise, ContentsCountPromise]).then(
    (result) => ({
      contents: result[0],
      paginationInfo: {
        totalItems: result[1],
        totalPages: Math.ceil(result[1] / pageSize),
        pageSize,
        pageNumber,
      },
    }),
  );
}

export async function createContent(
  createdContent: ICreateContent,
): Promise<IContentSchema> {
  const content = new Content(createdContent);

  const savedContent = await content.save();

  return savedContent;
}

export async function updateContent(
  id: string,
  updatedContent: IUpdateContent,
): Promise<IContentSchema> {
  //GET IT
  const content = await Content.findOne({ _id: id });

  //VALIDATE IT
  if (!content) {
    return ConstructDBHelperExpectedError(404, "Content doesn't exist");
  }

  //CHANGE IT
  content.set(updatedContent);

  //SAVE IT
  const savedContent = await content.save();

  return savedContent;
}

export async function updateIsActive(id: string, isActive: boolean) {
  //GET IT
  const content = await Content.findOne({ _id: id });

  //VALIDATE IT
  if (!content) {
    return ConstructDBHelperExpectedError(404, "Content doesn't exist");
  }

  content.isActive = isActive;

  const savedContent = await content.save();

  return savedContent;
}

export async function deleteContent(content: IContentSchema) {
  const result = await content.deleteOne();

  return result;
}
