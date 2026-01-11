import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: false,
}
);


redis.on('connect',()=>{
  console.log("Redis connected successfully");
});
redis.on('error',(error)=>{
  console.log("Redis connection Error ",error);
});
redis.on('ready',()=>{
  console.log("Redis ready to accept commands");
});
redis.on('close',()=>{
  console.log("Redis Closed");
});


process.on('SIGINT',async()=>{
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

export default redis;
