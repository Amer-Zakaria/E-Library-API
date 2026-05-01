import type IPagination from "../Interfaces/IPagination.js";
import { Destination } from "../models/destination.js";
import type {
  ICreateDestination,
  IUpdateDestination,
} from "../models/destination.js";

import type IDestinationSchema from "../Interfaces/IDestinationSchema.js";

export async function getDestinations(pagination: IPagination) {
  const pageNumber = +(pagination.pageNumber ?? 1);
  const pageSize = +(pagination.pageSize ?? 10);

  const DestinationsPromise = Destination.aggregate([
    {
      $lookup: {
        from: "projects",
        localField: "_id",
        foreignField: "destination",
        as: "projects",
      },
    },
    {
      $addFields: {
        projectCount: { $size: "$projects" },
      },
    },
    {
      $project: {
        projects: 0,
      },
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ]);

  const DestinationsCountPromise = Destination.find().count();

  return Promise.all([DestinationsPromise, DestinationsCountPromise]).then(
    (result) => ({
      destinations: result[0],
      paginationInfo: {
        totalItems: result[1],
        totalPages: Math.ceil(result[1] / pageSize),
        pageSize,
        pageNumber,
      },
    })
  );
}

export async function createDestination(
  createdDestination: ICreateDestination
): Promise<IDestinationSchema> {
  const destination = new Destination(createdDestination);

  const savedDestination = await destination.save();

  return savedDestination;
}

export async function updateDestination(
  id: string,
  updatedDestination: IUpdateDestination
): Promise<IDestinationSchema> {
  //GET IT
  const destination = (await Destination.findOne({ _id: id }))!;

  //CHANGE IT
  destination.set(updatedDestination);

  //SAVE IT
  const savedDestination = await destination.save();

  return savedDestination;
}

export async function deleteDestination(id: string) {
  //GET IT
  const destination = (await Destination.findOne({ _id: id }))!;

  //VALIDATE IF IT'S LINKED TO PROJECTS
  if (true) {
  }

  const result = await destination.deleteOne();

  return result;
}
