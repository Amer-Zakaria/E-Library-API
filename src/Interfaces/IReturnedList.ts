import type IPagination from "./IPagination.js";

export default interface IReturnedList<listElement> {
  [key: string]:
    | listElement[]
    | (IPagination & { totalPages: number; totalItems: number });
  paginationInfo: IPagination & { totalPages: number; totalItems: number };
}
