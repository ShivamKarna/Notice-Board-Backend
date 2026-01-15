import { db } from "../db/postgres/db.postgres.ts";
import {
  usersTable,
  posts,
  groups,
  media,
  likes,
  comments,
} from "../db/postgres/schemas";
import { eq, and, or, desc, asc, sql, ilike } from "drizzle-orm";
import { cacheService, CacheService } from "./redis_cache.service.ts";
import { ApiError } from "../utils/ApiError.ts";
import { UploadStream } from "cloudinary";
import { STATUS_CODE } from "../types/httpStatus.ts";

export class SearchService {
  private readonly CACHE_TTL_SHORT = parseInt(
    process.env.CACHE_TTL_SHORT || "300"
  );

  async searchGroups(query: string, page: number = 1, limit: number = 20) {
    type resultType = typeof groups.$inferSelect & {
      owner: {
        id: string;
        username: string;
      };
      memberCount: number;
    };
    if (!query || query.trim().length < 2) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Search query must be at least 2 characters"
      );
    }
    const offset = (page - 1) * limit;
    const searchTerm = `%${query.trim()}%`; // consiering that chars will be seperated by %

    const cacheKey = `search-groups:${query}:${page}:${limit}`;
    const cached = await cacheService.get<resultType>("search", cacheKey);

    if (cached) {
      return cached;
    }

    const results = await db
      .select({
        group: groups,
        owner: {
          id: usersTable.id,
          username: usersTable.username,
        },
        memberCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM group_members 
          WHERE group_members.group_id = ${groups.id} 
          AND group_members.is_active = true
        )`,
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .where(
        or(
          ilike(groups.name, searchTerm),
          ilike(groups.description, searchTerm)
        )
      )
      .orderBy(desc(groups.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCountNumber = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups)
      .where(
        or(
          ilike(groups.name, searchTerm),
          ilike(groups.description, searchTerm)
        )
      );

    const totalCount = totalCountNumber.length || 0;

    const result = {
      groups: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    await cacheService.set("search", cacheKey, result, this.CACHE_TTL_SHORT);

    return result;
  }

  // Search posts by title or content
  async searchPosts(
    query: string,
    filters: {
      groupId?: string;
      authorId?: string;
      status?: string;
      visibility?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    sort: "newest" | "oldest" | "most_liked" = "newest",
    page: number = 1,
    limit: number = 20
  ) {
    // Do the query validation
    // build where conditions, the conditions array and if conditions
    // do the sorting , with switch case
    // now write the main query
    // early return check ,if empty return righ away
    // build the postIds for later on Bulk media fetch
    // Bulk like count using the postIds from above, then build the likeMap
    // Bulk comment count using the postIds, then Build the Commentmap
    // Bulk media fetch , then build the Bulk media Map
    // Make the final postsWithRelations ,that contains teh like count  ,comment count, and medias too
    // Find teh total number of count
    // Return whole resposne

    if (!query || query.trim().length < 2) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Search query must be atleast 2 characters"
      );
    }
    const offset = (page - 1) * limit;
    const searchTerm = `%${query.trim()}%`;

    // Building where conditions
    const conditions = [
      or(ilike(posts.title, searchTerm), ilike(posts.content, searchTerm)),
    ];

    if (filters.groupId) conditions.push(eq(posts.groupId, filters.groupId));
    if (filters.authorId) conditions.push(eq(posts.authorId, filters.authorId));

    conditions.push(
      eq(posts.status, filters.status ?? "published"),
      eq(posts.visibility, filters.visibility ?? "public")
    );

    if (filters.startDate) {
      conditions.push(sql`${posts.publishedAt}>= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${posts.publishedAt} <= ${filters.endDate}`);
    }
    // sorting
    let orderBy;
    switch (sort) {
      case "oldest":
        orderBy = asc(posts.publishedAt);
        break;

      case "most_liked":
        orderBy = desc(sql`like_count`);
        break;

      default:
        orderBy = desc(posts.publishedAt);
    }

    // main query
    const results = await db
      .select({
        post: posts,
        author: {
          id: usersTable.id,
          username: usersTable.username,
        },
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    if (results.length === 0) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
    const postIds = results.map((r) => r.post.id);
    // Bulk like counts
    const like = await db
      .select({
        postId: likes.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(likes)
      .where(sql`post_id IN (${postIds})`)
      .groupBy(likes.postId);

    const likeMap = Object.fromEntries(like.map((l) => [l.postId, l.count]));

    const comment = await db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(sql`post_id IN (${postIds})`)
      .groupBy(comments.postId);

    const commentMap = Object.fromEntries(
      comment.map((c) => [c.postId, c.count])
    );

    // Bulk media fetch,  to fix N + 1 problem
    const mediaRows = await db
      .select()
      .from(media)
      .where(sql`post_id IN (${postIds})`)
      .orderBy(media.order);

    const mediaMap = mediaRows.reduce((acc, m) => {
      if (!acc[m.postId]) acc[m.postId] = [];
      acc[m.postId]!.push(m);
      return acc;
    }, {} as Record<string, typeof mediaRows>);
    // merge everything
    const postsWithRelations = results.map((r) => ({
      ...r,
      likeCount: likeMap[r.post.id] ?? 0,
      commentCount: commentMap[r.post.id] ?? 0,
      media: mediaMap[r.post.id] ?? [],
    }));

    // total count
    const totalCountNumber = await db
      .select({ count: sql<number>`coutn(*)::int` })
      .from(posts)
      .where(and(...conditions));

    const totalCount = totalCountNumber.length || 0;

    return {
      posts: postsWithRelations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // this is the main closing arrow
}

export const searchService = new SearchService();
