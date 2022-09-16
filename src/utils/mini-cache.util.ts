const AUTO_PURGE_INTERVAL = 60 * 1000;

export class MiniCache {
  private lastPurge = 0;
  private cache = new Map<string, { expiredAt: number; data: any }>();

  public get<T = any>(id: string): T | undefined {
    if (Date.now() - this.lastPurge > AUTO_PURGE_INTERVAL) {
      this.purgeExpired();
      this.lastPurge = Date.now();
    }
    const res = this.cache.get(id);
    if (res && res.expiredAt > Date.now()) {
      console.log('[MiniCache] hit:', id);
      return res.data;
    } else if (res) {
      this.cache.delete(id);
    }
    return undefined;
  }

  public set(id: string, data: any, ex: number): void {
    this.cache.set(id, {
      expiredAt: Date.now() + ex,
      data,
    });
  }

  public delete(id: string): void {
    this.cache.delete(id);
  }

  public purgeExpired(): void {
    for (const [id, { expiredAt }] of this.cache) {
      if (expiredAt <= Date.now()) {
        console.log('[MiniCache] purge expired:', id);
        this.cache.delete(id);
      }
    }
  }

  public getWrappedCacheFunc<T extends Array<any>, U>(id: string, ex: number, fn: (...args: T) => U) {
    return (...args: T): U => {
      const res = this.get(id);
      if (res !== undefined) {
        return res;
      }
      const data = fn(...args);
      this.set(id, data, ex);
      return data;
    };
  }

  public getWrappedCacheFuncAsync<T extends Array<any>, U>(id: string, ex: number, fn: (...args: T) => Promise<U>) {
    return async (...args: T): Promise<U> => {
      const res = this.get(id);
      if (res !== undefined) {
        return res;
      }
      const data = await fn(...args);
      this.set(id, data, ex);
      return data;
    };
  }
}
