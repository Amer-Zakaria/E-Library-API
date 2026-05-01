import type IProjectSchema from "../Interfaces/IProjectSchema.js";
import type IPagination from "../Interfaces/IPagination.js";
import type {
  ICreateProject,
  IProjectFilter,
  IUpdateProject,
} from "../models/project.js";
import { Project } from "../models/project.js";
import ConstructDBHelperExpectedError from "../utils/ConstructDBHelperExpectedError.js";
import type IReturnedList from "../Interfaces/IReturnedList.js";
import { Types } from "mongoose";

export async function getProjects(
  reqOrigin: string,
  pagination: IPagination,
  filters?: IProjectFilter,
): Promise<IReturnedList<IProjectSchema>> {
  const pageNumber = +(pagination.pageNumber ?? 1);
  const pageSize = +(pagination.pageSize ?? 10);

  //Constructing the filter object
  const filterConstructor: any = {};
  if (filters) {
    if (filters.types) filterConstructor.type = { $in: filters.types };
    if (filters.destination)
      filterConstructor.destination = new Types.ObjectId(filters.destination);
    if (filters.developer)
      filterConstructor.developer = new Types.ObjectId(filters.developer);
    if (reqOrigin === process.env.CUSTOMER_UI_URL)
      filterConstructor.isActive = true;
  }

  const ProjectsPromise = Project.aggregate([
    { $match: filterConstructor },
    {
      $lookup: {
        from: "developers",
        localField: "developer",
        foreignField: "_id",
        as: "developerInfo",
      },
    },
    {
      $lookup: {
        from: "destinations",
        localField: "destination",
        foreignField: "_id",
        as: "destinationInfo",
      },
    },
    {
      $project: {
        title: 1,
        desc: 1,
        type: 1,
        mainImage: 1,
        isActive: 1,
        location: {
          $concat: ["$location.area", ", ", "$location.city"],
        },
        developer: {
          $arrayElemAt: ["$developerInfo.name", 0],
        },
        destination: {
          $arrayElemAt: ["$destinationInfo.name", 0],
        },
        starting_price: { $min: "$unit_types.starting_price" },
      },
    },
    { $sort: { _id: -1 } },
  ])
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const ProjectsCountPromise = Project.find(filterConstructor).count();

  return Promise.all([ProjectsPromise, ProjectsCountPromise]).then(
    (result) => ({
      projects: result[0],
      paginationInfo: {
        totalItems: result[1],
        totalPages: Math.ceil(result[1] / pageSize),
        pageSize,
        pageNumber,
      },
    }),
  );
}

export async function createProject(
  createdProject: ICreateProject,
): Promise<IProjectSchema> {
  const project = new Project(createdProject);

  const savedProject = await project.save();

  return savedProject;
}

export async function updateProject(
  id: string,
  updatedProject: IUpdateProject,
): Promise<IProjectSchema> {
  //GET IT
  const project = await Project.findOne({ _id: id });

  //VALIDATE IT
  if (!project) {
    return ConstructDBHelperExpectedError(404, "Project doesn't exist");
  }

  //CHANGE IT
  project.set(updatedProject);

  //SAVE IT
  const savedProject = await project.save();

  return savedProject;
}

export async function updateIsActive(id: string, isActive: Boolean) {
  //GET IT
  const project = await Project.findOne({ _id: id });

  //VALIDATE IT
  if (!project) {
    return ConstructDBHelperExpectedError(404, "Project doesn't exist");
  }

  project.isActive = isActive;

  const savedProject = await project.save();

  return savedProject;
}

export async function deleteProject(project: IProjectSchema) {
  const result = await project.deleteOne();

  return result;
}
