import Redis from "ioredis";

// Upstash Redis Configuration
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env"
  );
}

// Extract host from URL (e.g., "https://concrete-toucan-23552.upstash.io" -> "concrete-toucan-23552.upstash.io")
const host = UPSTASH_REDIS_REST_URL.replace("https://", "").replace(
  "http://",
  ""
);

// Construct Upstash connection string: rediss://default:TOKEN@HOST:6379
const upstashUrl = `rediss://default:${UPSTASH_REDIS_REST_TOKEN}@${host}:6379`;

const redis = new Redis(upstashUrl, {
  retryStrategy: (times) => {
    if (times > 10) {
      console.error("Redis max retry attempts reached");
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: false,
  connectTimeout: 10000,
  tls: {
    rejectUnauthorized: true,
  },
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});
redis.on("error", (error) => {
  console.log("Redis connection Error ", error);
});
redis.on("ready", () => {
  console.log("Redis ready to accept commands");
});
redis.on("close", () => {
  console.log("Redis Closed");
});

process.on("SIGINT", async () => {
  console.log("Closing Redis connection...");
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing Redis connection...");
  await redis.quit();
  process.exit(0);
});

export default redis;
