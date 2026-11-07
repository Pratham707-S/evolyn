import crypto from 'node:crypto';

export interface EmbeddingCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
}

interface CacheEntry {
  vector: number[];
  expiresAt: number;
  lastAccessed: number;
}

export class EmbeddingCache {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry>();
  private accessCounter = 0;

  constructor(options: EmbeddingCacheOptions = {}) {
    const rawMax = options.maxEntries ?? 500;
    if (
      typeof rawMax !== 'number' ||
      !Number.isInteger(rawMax) ||
      rawMax <= 0 ||
      Number.isNaN(rawMax)
    ) {
      throw new Error(
        `Invalid maxEntries: ${rawMax}. Must be a strictly positive integer.`
      );
    }

    const rawTtl = options.ttlMs ?? 60 * 60 * 1000; // 1 hour default TTL
    if (
      typeof rawTtl !== 'number' ||
      !Number.isFinite(rawTtl) ||
      rawTtl <= 0 ||
      Number.isNaN(rawTtl)
    ) {
      throw new Error(
        `Invalid ttlMs: ${rawTtl}. Must be a strictly positive finite number.`
      );
    }

    this.maxEntries = rawMax;
    this.ttlMs = rawTtl;
  }

  private computeKey(model: string, dimensions: number, text: string): string {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `${model}:${dimensions}:${hash}`;
  }

  get(model: string, dimensions: number, text: string): number[] | undefined {
    if (
      typeof dimensions !== 'number' ||
      !Number.isInteger(dimensions) ||
      dimensions <= 0 ||
      Number.isNaN(dimensions) ||
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return undefined;
    }

    const key = this.computeKey(model, dimensions, text);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    entry.lastAccessed = ++this.accessCounter;
    // Return a clone to prevent external mutation of cached vectors
    return [...entry.vector];
  }

  set(model: string, dimensions: number, text: string, vector: number[]): void {
    if (
      typeof dimensions !== 'number' ||
      !Number.isInteger(dimensions) ||
      dimensions <= 0 ||
      Number.isNaN(dimensions) ||
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return;
    }

    // Only cache valid, finite vectors matching expected dimensions with zero NaNs
    if (
      !Array.isArray(vector) ||
      vector.length !== dimensions ||
      !vector.every(
        (val) => typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val)
      )
    ) {
      return;
    }

    const now = Date.now();
    const key = this.computeKey(model, dimensions, text);

    // Evict oldest/least-recently-accessed entries until cache has capacity for a new key
    while (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      vector: [...vector],
      expiresAt: now + this.ttlMs,
      lastAccessed: ++this.accessCounter,
    });
  }

  private evict(): void {
    const now = Date.now();
    // First remove any expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still at capacity, evict the least recently accessed entry
    if (this.cache.size >= this.maxEntries) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const defaultEmbeddingCache = new EmbeddingCache();

