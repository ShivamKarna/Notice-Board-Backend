import { db } from "../db/postgres/db.postgres";
import { groupLikes, groups, usersTable } from "../db/postgres/schemas";
import { eq, and, desc } from "drizzle-orm";
import { cacheService } from "./redis_cache.service";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";

export class GroupLikesService {
  private readonly CACHE_TTL_MEDIUM = parseInt(
    process.env.CACHE_TTL_MEDIUM || "1800"
  );

  async likeGroup(userId: string, groupId: string) {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    AppAssert(
      group,
      STATUS_CODE.NOT_FOUND,
      "Group Not Found or does not exist"
    );

    const existingLike = await db
      .select()
      .from(groupLikes)
      .where(
        and(eq(groupLikes.userId, userId), eq(groupLikes.groupId, groupId))
      )
      .limit(1);

    if (existingLike.length > 0) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        "You have already Favourited this group"
      );
    }

    await db.insert(groupLikes).values({ userId, groupId });

    await cacheService.delete("user-favorite-groups", userId);
    await cacheService.delete("group-favorites-count", groupId);

    return { success: true, message: "Group added to favorites" };
  }

  async unlikeGroup(userId: string, groupId: string) {
    // Check if like exists
    const existingLike = await db
      .select()
      .from(groupLikes)
      .where(
        and(eq(groupLikes.userId, userId), eq(groupLikes.groupId, groupId))
      )
      .limit(1);

    if (existingLike.length === 0) {
      throw new Error("You have not favorited this group");
    }

    // Delete like
    await db
      .delete(groupLikes)
      .where(
        and(eq(groupLikes.userId, userId), eq(groupLikes.groupId, groupId))
      );

    await cacheService.delete("user-favorite-groups", userId);
    await cacheService.delete("group-favorites-count", groupId);

    return { success: true, message: "Group removed from favorites" };
  }

  async hasUserLikedGroup(userId: string, groupId: string): Promise<boolean> {
    const existingLike = await db
      .select()
      .from(groupLikes)
      .where(
        and(eq(groupLikes.userId, userId), eq(groupLikes.groupId, groupId))
      )
      .limit(1);

    return existingLike.length > 0;
  }

  async getUserFavoriteGroups(userId: string) {
    type FavoriteGroup = {
      group: typeof groups.$inferSelect;
      owner: {
        id: string;
        username: string | null;
      };
      likedAt: Date | null;
    };

    const cached = await cacheService.get<FavoriteGroup[]>(
      "user-favorite-groups",
      userId
    );

    if (cached) {
      return cached;
    }

    const favoriteGroups = await db
      .select({
        group: groups,
        owner: {
          id: usersTable.id,
          username: usersTable.username,
        },
        likedAt: groupLikes.createdAt,
      })
      .from(groupLikes)
      .innerJoin(groups, eq(groupLikes.groupId, groups.id))
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .where(eq(groupLikes.userId, userId))
      .orderBy(desc(groupLikes.createdAt));

    await cacheService.set(
      "user-favorite-groups",
      userId,
      favoriteGroups,
      this.CACHE_TTL_MEDIUM
    );

    return favoriteGroups;
  }

  async getGroupFavoritesCount(groupId: string): Promise<number> {
    const cached = await cacheService.get<number>(
      "group-favorites-count",
      groupId
    );

    if (cached !== null) {
      return cached;
    }

    const count = await db
      .select()
      .from(groupLikes)
      .where(eq(groupLikes.groupId, groupId));

    const favCount = count.length;

    // Cache the count
    await cacheService.set(
      "group-favorites-count",
      groupId,
      favCount,
      this.CACHE_TTL_MEDIUM
    );

    return favCount;
  }

  // this is the main closing arrow
}

export const groupLikesService = new GroupLikesService();
