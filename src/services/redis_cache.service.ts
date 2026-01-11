import redis from "../config/redis.config.ts";



export class CacheService {
  private defaultTTL = parseInt(process.env.CACHE_TTL_MEDIUM || '1800');

  private generateKey(prefix: string, identifier: string): string {
    return `noticeboard:${prefix}:${identifier}`;
  }

  async get<T>(prefix: string, identifier: string): Promise<T | null> {
    try {
      const key = this.generateKey(prefix, identifier);
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(
    prefix: string,
    identifier: string,
    data: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(prefix: string, identifier: string): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(`noticeboard:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async exists(prefix: string, identifier: string): Promise<boolean> {
    try {
      const key = this.generateKey(prefix, identifier);
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(prefix: string, identifier: string, amount: number = 1): Promise<number> {
    try {
      const key = this.generateKey(prefix, identifier);
      return await redis.incrby(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async decrement(prefix: string, identifier: string, amount: number = 1): Promise<number> {
    try {
      const key = this.generateKey(prefix, identifier);
      return await redis.decrby(key, amount);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  }

  async addToSet(prefix: string, identifier: string, member: string): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await redis.sadd(key, member);
    } catch (error) {
      console.error('Cache add to set error:', error);
    }
  }

  async removeFromSet(prefix: string, identifier: string, member: string): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await redis.srem(key, member);
    } catch (error) {
      console.error('Cache remove from set error:', error);
    }
  }

  async isMemberOfSet(prefix: string, identifier: string, member: string): Promise<boolean> {
    try {
      const key = this.generateKey(prefix, identifier);
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.error('Cache is member of set error:', error);
      return false;
    }
  }

  async getSetMembers(prefix: string, identifier: string): Promise<string[]> {
    try {
      const key = this.generateKey(prefix, identifier);
      return await redis.smembers(key);
    } catch (error) {
      console.error('Cache get set members error:', error);
      return [];
    }
  }

  async getSetSize(prefix: string, identifier: string): Promise<number> {
    try {
      const key = this.generateKey(prefix, identifier);
      return await redis.scard(key);
    } catch (error) {
      console.error('Cache get set size error:', error);
      return 0;
    }
  }

  async getOrSet<T>(
    prefix: string,
    identifier: string,
    fetchFunction: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // try to get from cache
    const cached = await this.get<T>(prefix, identifier);
    
    if (cached !== null) {
      return cached;
    }

    // if not in cache ,fetch from database
    const data = await fetchFunction();

    // store in cache
    await this.set(prefix, identifier, data, ttl);

    return data;
  }

  // invalidate related caches
  async invalidateRelated(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }
    } catch (error) {
      console.error('Cache invalidate related error:', error);
    }
  }
  // clear all cache
  async clearAll(): Promise<void> {
    try {
      const keys = await redis.keys('noticeboard:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }



}

export const cacheService = new CacheService();
