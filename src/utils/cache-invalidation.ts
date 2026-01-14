import { cacheService } from "../services/redis_cache.service";

export class CacheInvalidation{
  static async invalidatePost(postId: string, groupId: string) {
    await Promise.all([
      cacheService.deletePattern(`post:${postId}*`),
      cacheService.deletePattern(`guest-post:${postId}*`),
      cacheService.delete('post-comments', postId),
      cacheService.delete('post-comments-count', postId),
      cacheService.delete('post-likes-count', postId),
      cacheService.deletePattern(`post-likes:${postId}*`),
      cacheService.delete('group-posts', groupId),
      cacheService.deletePattern(`guest:public-posts:${groupId}*`),
      cacheService.deletePattern('guest:public-feed*'),
      cacheService.deletePattern('guest:trending-posts*'),
    ]);
  }

  static async invalidateGroup(groupId: string) {
    await Promise.all([
      cacheService.deletePattern(`group:${groupId}*`),
      cacheService.delete('guest-group', groupId),
      cacheService.deletePattern('guest:public-groups*'),
      cacheService.deletePattern('guest:trending-groups*'),
      cacheService.delete('group-posts', groupId),
    ]);
  }

  static async invalidateUserNotifications(userId: string) {
    await Promise.all([
      cacheService.delete('user-notifications', userId),
      cacheService.delete('user-notifications-unread', userId),
      cacheService.delete('user-unread-count', userId),
    ]);
  }

  static async invalidateComments(postId: string) {
    await Promise.all([
      cacheService.delete('post-comments', postId),
      cacheService.delete('post-comments-count', postId),
    ]);
  }


  static async invalidateLikes(postId: string) {
    await Promise.all([
      cacheService.delete('post-likes-count', postId),
      cacheService.delete('post-likes-list', postId),
      cacheService.deletePattern(`post-likes:${postId}*`),
    ]);
  }

  static async invalidateAllGuestCaches() {
    await cacheService.deletePattern('guest:*');
  }
};

