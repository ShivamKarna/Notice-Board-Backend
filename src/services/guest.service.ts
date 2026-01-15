import { db } from "../db/postgres/db.postgres";
import { usersTable, posts, media, groups } from "../db/postgres/schemas";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { cacheService } from "./redis_cache.service";

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PublicGroupItem = {
  groups: typeof groups.$inferSelect;
  owner: {
    id: string;
    username: string;
  };
  memberCount: number;
  postCount: number;
};

type PublicGroupsResponse = {
  groups: PublicGroupItem[];
  pagination: Pagination;
};

type GroupDetailsResponse = {
  group: typeof groups.$inferSelect;
  owner: {
    id: string;
    username: string;
  };
  memberCount: number;
  postCount: number;
};

type PublicPostItem = {
  post: typeof posts.$inferSelect;
  author: {
    id: string;
    username: string;
  };
  commentCount: number;
  likeCount: number;
  media: (typeof media.$inferSelect)[];
};

type PublicPostsResponse = {
  posts: PublicPostItem[];
  pagination: Pagination;
};

type PublicPostDetailsResponse = {
  post: typeof posts.$inferSelect;
  author: {
    id: string;
    username: string;
  };
  group: {
    id: string;
    name: string;
  };
  commentCount: number;
  likeCount: number;
  media: (typeof media.$inferSelect)[];
};

export class GuestService {
  private readonly CACHE_TTL_MEDIUM = parseInt(
    process.env.CACHE_TTL_MEDIUM || "1800"
  );
  private readonly CACHE_TTL_LONG = parseInt(
    process.env.CACHE_TTL_LONG || "3600"
  );

  async getPublicGroups(
    page: number = 1,
    limit: number = 20
  ): Promise<PublicGroupsResponse> {
    const offset = (page - 1) * limit;
    const cacheKey = `public-groups:page-${page}:limit-${limit}`;

    const cached = await cacheService.get<PublicGroupsResponse>(
      "guest",
      cacheKey
    );

    if (cached) {
      return cached;
    }

    const publicGroups = await db
      .select({
        groups: groups,
        owner: {
          id: usersTable.id,
          username: usersTable.username,
        },
        memberCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM group_members
        WHERE group_members.group_id =${groups.id}
        AND group_members.is_active = true
      )`,
        postCount: sql<number>`(
          SELECT COUNT(*):: int
          FROM posts
          WHERE posts.group_id = ${groups.id}
          AND posts.statsus ='published'
        )`,
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .orderBy(desc(groups.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups);

    const totalCount = totalCountResult[0]?.count ?? 0;

    const result = {
      groups: publicGroups,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    await cacheService.set("guest", cacheKey, result, this.CACHE_TTL_MEDIUM);

    return result;
  }

  async getGroupDetails(groupId: string): Promise<GroupDetailsResponse | null> {
    const cached = await cacheService.get<GroupDetailsResponse>(
      "guest-group",
      groupId
    );

    if (cached) {
      return cached;
    }

    const [groupDetails] = await db
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
        postCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM posts 
          WHERE posts.group_id = ${groups.id} 
          AND posts.status = 'published'
          AND posts.visibility = 'public'
        )`,
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!groupDetails) {
      return null;
    }
    await cacheService.set(
      "guest-group",
      groupId,
      groupDetails,
      this.CACHE_TTL_MEDIUM
    );

    return groupDetails;
  }

  // Get all public posts of one specific group
  async getGroupPublicPosts(
    groupId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PublicPostsResponse> {
    const offset = (page - 1) * limit;
    const cacheKey = `public-posts:${groupId}:page-${page}:limit-${limit}`;

    // Try cache first
    const cached = await cacheService.get<PublicPostsResponse>(
      "guest",
      cacheKey
    );

    if (cached) {
      return cached;
    }

    // Fetch from database
    const publicPosts = await db
      .select({
        post: posts,
        author: {
          id: usersTable.id,
          username: usersTable.username,
        },
        commentCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM comments 
          WHERE comments.post_id = ${posts.id}
        )`,
        likeCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM likes 
          WHERE likes.post_id = ${posts.id}
        )`,
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .where(
        and(
          eq(posts.groupId, groupId),
          eq(posts.status, "published"),
          eq(posts.visibility, "public")
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    // Get media for each post
    const postsWithMedia = await Promise.all(
      publicPosts.map(async (item) => {
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, item.post.id))
          .orderBy(media.order);

        return {
          ...item,
          media: postMedia,
        };
      })
    );

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(
        and(
          eq(posts.groupId, groupId),
          eq(posts.status, "published"),
          eq(posts.visibility, "public")
        )
      );

    const totalCount = totalCountResult[0]?.count ?? 0;

    const result = {
      posts: postsWithMedia,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache the result
    await cacheService.set("guest", cacheKey, result, this.CACHE_TTL_MEDIUM);

    return result;
  }

  // Get details about one specific public post
  async getPublicPost(
    postId: string
  ): Promise<PublicPostDetailsResponse | null> {
    // Try cache first
    const cached = await cacheService.get<PublicPostDetailsResponse>(
      "guest-post",
      postId
    );

    if (cached) {
      return cached;
    }

    // Fetch from database
    const [postDetails] = await db
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
        commentCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM comments 
          WHERE comments.post_id = ${posts.id}
        )`,
        likeCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM likes 
          WHERE likes.post_id = ${posts.id}
        )`,
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.status, "published"),
          eq(posts.visibility, "public")
        )
      )
      .limit(1);

    if (!postDetails) {
      return null;
    }

    // Get media
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId))
      .orderBy(media.order);

    const result = {
      ...postDetails,
      media: postMedia,
    };

    // Cache the result
    await cacheService.set("guest-post", postId, result, this.CACHE_TTL_MEDIUM);

    return result;
  }

  //Get the whole public post feed, ofc with the whole post deatil too
  async getPublicFeed(page: number = 1, limit: number = 20) {
    page = Math.max(1, page);
    limit = Math.min(limit, 50); // hard cap to prevent abuse
    const offset = (page - 1) * limit;

    const cacheKey = `public-feed:page-${page}:limit-${limit}`;

    // added proper type for cached item get , that is PublicPostItem
    const cached = await cacheService.get<PublicPostItem>("guest", cacheKey);
    if (cached) {
      return cached;
    }

    // 1️⃣ Fetch posts
    const publicPosts = await db
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
        commentCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM comments 
        WHERE comments.post_id = ${posts.id}
      )`,
        likeCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM likes 
        WHERE likes.post_id = ${posts.id}
      )`,
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(and(eq(posts.status, "published"), eq(posts.visibility, "public")))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    // Early return if no posts
    if (publicPosts.length === 0) {
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

    // 2️⃣ Fetch ALL media in one query, saving from N+1 query problem
    const postIds = publicPosts.map((p) => p.post.id);

    const allMedia = await db
      .select()
      .from(media)
      .where(inArray(media.postId, postIds))
      .orderBy(media.postId, media.order);
    // 3️⃣ Group media by postId
    const mediaByPostId = new Map<string, typeof allMedia>();

    for (const m of allMedia) {
      if (!mediaByPostId.has(m.postId)) {
        mediaByPostId.set(m.postId, []);
      }
      mediaByPostId.get(m.postId)!.push(m);
    }

    // 4️⃣ Attach media to posts
    const postsWithMedia = publicPosts.map((item) => ({
      ...item,
      media: mediaByPostId.get(item.post.id) || [],
    }));

    // 5️⃣ Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(
        and(eq(posts.status, "published"), eq(posts.visibility, "public"))
      );

    const totalCount = totalCountResult[0]?.count ?? 0;

    const result = {
      posts: postsWithMedia,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // 6️⃣ Cache result
    await cacheService.set("guest", cacheKey, result, this.CACHE_TTL_MEDIUM);

    return result;
  }

  async trackGuestActivity(
    sessionToken: string,
    action: string,
    entityId?: string
  ) {
    const key = `guest-activity:${sessionToken}`;
    const activity = {
      action,
      entityId,
      timestamp: new Date().toISOString(),
    };

    await cacheService.set("guest-activity", sessionToken, activity, 86400);
  }

  async getTrendingGroups(limit: number = 10) {
    const key = `trending-groups:${limit}`;
    const cached = await cacheService.get<PublicGroupItem>("guest", key);

    if (cached) {
      return cached;
    }

    const trendingGroups = await db
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
        recentPostCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM posts 
          WHERE posts.group_id = ${groups.id} 
          AND posts.status = 'published'
          AND posts.published_at > NOW() - INTERVAL '7 days'
        )`,
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .orderBy(
        desc(sql`(
          SELECT COUNT(*) 
          FROM posts 
          WHERE posts.group_id = ${groups.id} 
          AND posts.status = 'published'
          AND posts.published_at > NOW() - INTERVAL '7 days'
        )`)
      )
      .limit(limit);

    await cacheService.set("guest", key, trendingGroups, this.CACHE_TTL_LONG);
    return trendingGroups;
  }

  async getTrendingPosts(limit: number = 10) {
    limit = Math.min(limit, 50);
    const cacheKey = `trending-posts:${limit}`;

    type TrendingPost = {
      post: typeof posts.$inferSelect;
      author: { id: string; username: string | null };
      group: { id: string; name: string };
      commentCount: number;
      likeCount: number;
      engagementScore: number;
    };

    const cached = await cacheService.get<TrendingPost[]>("guest", cacheKey);
    if (cached) {
      return cached;
    }

    const trendingPosts = await db
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
        commentCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM comments 
        WHERE comments.post_id = ${posts.id}
      )`,
        likeCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM likes 
        WHERE likes.post_id = ${posts.id}
      )`,
        engagementScore: sql<number>`(
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id}) * 2 +
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id})
      )::int`,
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(
        and(
          eq(posts.status, "published"),
          eq(posts.visibility, "public"),
          sql`${posts.publishedAt} > NOW() - INTERVAL '7 days'`
        )
      )
      .orderBy(
        desc(sql`(
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id}) * 2 +
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id})
      )`)
      )
      .limit(limit);

    if (trendingPosts.length === 0) {
      return [];
    }

    // 3️⃣ Fetch ALL media in one query, to save from the 1 + N query problem
    const postIds = trendingPosts.map((p) => p.post.id);

    const allMedia = await db
      .select()
      .from(media)
      .where(inArray(media.postId, postIds))
      .orderBy(media.postId, media.order);

    const mediaByPostId = new Map<string, typeof allMedia>();

    for (const m of allMedia) {
      if (!mediaByPostId.has(m.postId)) {
        mediaByPostId.set(m.postId, []);
      }
      mediaByPostId.get(m.postId)!.push(m);
    }

    // 5️⃣ Attach media to posts
    const postsWithMedia = trendingPosts.map((item) => ({
      ...item,
      media: mediaByPostId.get(item.post.id) || [],
    }));

    await cacheService.set(
      "guest",
      cacheKey,
      postsWithMedia,
      this.CACHE_TTL_MEDIUM
    );

    return postsWithMedia;
  }

  // this is the main closing bracket
}

export const guestService = new GuestService();
