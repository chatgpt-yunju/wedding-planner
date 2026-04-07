import { RateLimiterMemory } from 'rate-limiter-flexible';

// 内存限流（开发环境使用）
// 生产环境建议使用 Redis: RateLimiterRedis
const rateLimiter = new RateLimiterMemory({
  points: 5,     // 5次请求
  duration: 60,  // 60秒窗口
  blockDuration: 600, // 封禁 10 分钟
});

/**
 * 速率限制中间件
 * 应用于: 注册、登录、同步上传
 */
export async function rateLimit(req, res, next) {
  try {
    const key = `rl:${req.ip}:${req.route?.path || req.path}`;
    const remaining = await rateLimiter.get(key);
    
    if (remaining <= 0) {
      const data = await rateLimiter.get(key);
      const retrySeconds = data?.msBeforeNext || 600;
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(retrySeconds / 1000)
      });
    }
    
    await rateLimiter.consume(key);
    res.setHeader('X-RateLimit-Limit', 5);
    res.setHeader('X-RateLimit-Remaining', remaining - 1);
    next();
  } catch (err) {
    console.error('Rate limit error:', err);
    // 限流器出错时不阻塞请求
    next();
  }
}
