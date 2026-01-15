import { searchService } from "../services/search.service";
import type { Response, Request, NextFunction } from "express";
import { AsyncHandler } from "../utils/AsyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError.ts";
import { STATUS_CODE } from "../types/httpStatus";
import { MySqlDateBuilder } from "drizzle-orm/mysql-core";

type PostFilters = {
  groupId?: string;
  authorId?: string;
  status?: string;
  visibility?: string;
  startDate?: Date;
  endDate?: Date;
};

type SortOption = "newest" | "oldest" | "most_liked";

export class SearchController {
  searchGroups = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { q: query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || typeof query !== "string") {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Query is required");
      }

      const result = await searchService.searchGroups(query, page, limit);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result));
    },
  );
  searchPosts = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        q: query,
        groupId,
        authorId,
        status,
        visibility,
        startDate,
        endDate,
        sort,
      } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      if (!query || typeof query !== "string") {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Search query is required");
      }

      const filters: PostFilters = {};
      if (groupId) filters.groupId = groupId as string;
      if (authorId) filters.authorId = authorId as string;
      if (status) filters.status = status as string;
      if (visibility) filters.visibility = visibility as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      const sortOption = (sort as string) || "newest";

      const result = await searchService.searchPosts(
        query,
        filters,
        sortOption as SortOption,
        page,
        limit,
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result));
    },
  );
  searchUsers = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { q: query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || typeof query !== "string") {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Search query is required");
      }

      const result = await searchService.searchUsers(query, page, limit);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result));
    },
  );
  filterPosts = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        groupId,
        authorId,
        status,
        visibility,
        startDate,
        endDate,
        sort,
      } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: PostFilters = {};
      if (groupId) filters.groupId = groupId as string;
      if (authorId) filters.authorId = authorId as string;
      if (status) filters.status = status as string;
      if (visibility) filters.visibility = visibility as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const sortOption = (sort as string) || "newest";

      const result = await searchService.getFilteredPosts(
        filters,
        sortOption as SortOption,
        page,
        limit,
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result));
    },
  );
}

export const searchController = new SearchController();
