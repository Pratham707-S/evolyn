import { directPool } from '../../db/index.js';

export const MAINTENANCE_ADVISORY_LOCK_ID = 88424288n;

export class MaintenanceGateActiveError extends Error {
  public readonly code = 'MAINTENANCE_GATE_ACTIVE';

  constructor(
    message = 'Brand governance pipeline is temporarily locked for active embedding re-indexing. Please retry shortly.'
  ) {
    super(message);
    this.name = 'MaintenanceGateActiveError';
  }
}

export interface PoolClientLike {
  query(sql: string, params?: any[]): Promise<{ rows: any[] }>;
  release(): void;
}

export interface PoolLike {
  connect(): Promise<PoolClientLike>;
}

export class MaintenanceGate {
  private localActive = false;
  private reason: string | null = null;

  constructor(private readonly pool?: PoolLike) {}

  public isLocalActive(): boolean {
    return this.localActive;
  }

  public setLocalActive(active: boolean, reason?: string): void {
    this.localActive = active;
    this.reason = reason || null;
  }

  /**
   * Executes a protected operation (review, rewrite, or ingestion) holding a shared advisory lock.
   * Multiple operations can hold shared locks concurrently.
   * If an exclusive migration lock is held, pg_try_advisory_lock_shared returns false,
   * immediately throwing MaintenanceGateActiveError (mapped to HTTP 503).
   */
  public async withSharedLock<T>(operation: () => Promise<T>): Promise<T> {
    if (this.localActive) {
      throw new MaintenanceGateActiveError(this.reason || undefined);
    }

    if (!this.pool) {
      return await operation();
    }

    const client = await this.pool.connect();
    let lockAcquired = false;

    try {
      const lockRes = await client.query(
        'SELECT pg_try_advisory_lock_shared($1) as acquired;',
        [MAINTENANCE_ADVISORY_LOCK_ID.toString()]
      );
      lockAcquired = Boolean(lockRes.rows[0]?.acquired);

      if (!lockAcquired) {
        throw new MaintenanceGateActiveError(
          'Brand governance pipeline is temporarily locked for active embedding re-indexing. Please retry shortly.'
        );
      }

      return await operation();
    } finally {
      if (lockAcquired) {
        try {
          await client.query(
            'SELECT pg_advisory_unlock_shared($1);',
            [MAINTENANCE_ADVISORY_LOCK_ID.toString()]
          );
        } catch (unlockErr) {
          console.error('[MaintenanceGate] Error releasing shared advisory lock:', unlockErr);
        }
      }
      client.release();
    }
  }

  /**
   * Backward-compatible check for callers.
   */
  public async assertOperational(): Promise<void> {
    if (this.localActive) {
      throw new MaintenanceGateActiveError(this.reason || undefined);
    }

    if (this.pool) {
      const client = await this.pool.connect();
      try {
        const lockRes = await client.query(
          'SELECT pg_try_advisory_lock_shared($1) as acquired;',
          [MAINTENANCE_ADVISORY_LOCK_ID.toString()]
        );
        const acquired = Boolean(lockRes.rows[0]?.acquired);
        if (!acquired) {
          throw new MaintenanceGateActiveError(
            'Global brand governance pipeline is currently locked for embedding re-indexing by an active migration process.'
          );
        }
        await client.query('SELECT pg_advisory_unlock_shared($1);', [
          MAINTENANCE_ADVISORY_LOCK_ID.toString(),
        ]);
      } finally {
        client.release();
      }
    }
  }

  /**
   * Acquires the global exclusive advisory lock for migration on a dedicated client.
   * Waits for existing in-flight shared operations to finish up to timeoutMs.
   */
  public static async acquireGlobalExclusiveLock(
    client: PoolClientLike,
    timeoutMs = 30000,
    pollIntervalMs = 250
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const res = await client.query(
        'SELECT pg_try_advisory_lock($1) as acquired;',
        [MAINTENANCE_ADVISORY_LOCK_ID.toString()]
      );
      if (Boolean(res.rows[0]?.acquired)) {
        return; // Exclusive lock acquired!
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(
      `Could not acquire exclusive migration lock within ${timeoutMs}ms: active operations did not drain.`
    );
  }

  /**
   * Releases the global exclusive advisory lock on the dedicated client.
   */
  public static async releaseGlobalExclusiveLock(client: PoolClientLike): Promise<void> {
    await client.query('SELECT pg_advisory_unlock($1);', [
      MAINTENANCE_ADVISORY_LOCK_ID.toString(),
    ]);
  }
}

export const defaultMaintenanceGate = new MaintenanceGate(
  process.env.NODE_ENV === 'test' ? undefined : directPool
);
