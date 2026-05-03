import type IPagination from "../Interfaces/IPagination.js";
import { Category } from "../models/category.js";
import type { ICreateCategory, IUpdateCategory } from "../models/category.js";

import type ICategorySchema from "../Interfaces/ICategorySchema.js";
import { Content } from "../models/content.js";
import ConstructDBHelperExpectedError from "../utils/ConstructDBHelperExpectedError.js";

export async function getCategories(pagination: IPagination) {
  const pageNumber = +(pagination.pageNumber ?? 1);
  const pageSize = +(pagination.pageSize ?? 10);

  const CategoriesPromise = Category.aggregate([
    {
      $lookup: {
        from: "contents",
        localField: "_id",
        foreignField: "category",
        as: "contents",
      },
    },
    {
      $addFields: {
        contentCount: { $size: "$contents" },
      },
    },
    {
      $project: {
        contents: 0,
      },
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ]);

  const CategoriesCountPromise = Category.find().count();

  return Promise.all([CategoriesPromise, CategoriesCountPromise]).then(
    (result) => ({
      categories: result[0],
      paginationInfo: {
        totalItems: result[1],
        totalPages: Math.ceil(result[1] / pageSize),
        pageSize,
        pageNumber,
      },
    }),
  );
}

export async function createCategory(
  createdCategory: ICreateCategory,
): Promise<ICategorySchema> {
  const category = new Category(createdCategory);

  const savedCategory = await category.save();

  return savedCategory;
}

export async function updateCategory(
  id: string,
  updatedCategory: IUpdateCategory,
): Promise<ICategorySchema> {
  //GET IT
  const category = await Category.findOne({ _id: id });

  if (!category) {
    return ConstructDBHelperExpectedError(404, "Category doesn't exist");
  }

  //CHANGE IT
  category.set(updatedCategory);

  //SAVE IT
  const savedCategory = await category.save();

  return savedCategory;
}

export async function deleteCategory(id: string) {
  //GET IT
  const category = await Category.findOne({ _id: id });

  if (!category) {
    return ConstructDBHelperExpectedError(404, "Category doesn't exist");
  }

  //VALIDATE IF IT'S LINKED TO CONTENTS
  const linkedContents = await Content.countDocuments({ category: id });
  if (linkedContents > 0) {
    return ConstructDBHelperExpectedError(
      400,
      "Cannot delete category because it is linked to contents",
    );
  }

  const result = await category.deleteOne();

  return result;
}
