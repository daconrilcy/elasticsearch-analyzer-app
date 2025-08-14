// Token Bucket Rate Limiter - 5 requêtes par seconde
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens par milliseconde

  constructor(maxTokens: number = 5, refillRate: number = 5 / 1000) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async consume(): Promise<void> {
    this.refill();
    
    if (this.tokens < 1) {
      // Attendre qu'un token soit disponible
      const waitTime = (1 - this.tokens) / this.refillRate;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }
    
    this.tokens -= 1;
  }
}

// Instance globale du rate limiter
const globalRateLimiter = new TokenBucket();

export async function withRateLimit<T>(
  fn: () => Promise<T>
): Promise<T> {
  await globalRateLimiter.consume();
  return fn();
}

export function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    await globalRateLimiter.consume();
    return fn(...args);
  }) as T;
}
