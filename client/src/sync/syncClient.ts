import { io, type Socket } from 'socket.io-client';
import { db } from '../db/index';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class CoupleSync {
  private socket: Socket | null = null;
  private token: string;
  private coupleId: string;
  private pendingQueue: any[] = [];
  private isConnected: boolean = false;

  constructor(token: string, coupleId: string) {
    this.token = token;
    this.coupleId = coupleId;
    console.log(`[Sync] Instance created for couple ${coupleId}`);
  }

  async init() {
    await this.initDB();
    this.connect();
  }

  private async initDB() {
    // Dexie db is already defined, just ensure it's ready
    await db.open();
  }

  private connect() {
    console.log(`[Sync] Connecting for couple ${this.coupleId}...`);
    const lastSyncTs = localStorage.getItem('lastSyncTs') || 0;

    this.socket = io(SOCKET_URL, {
      auth: { token: this.token, lastSyncTs },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('[Sync] Connected');
      this.isConnected = true;
      this.flushPendingQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Sync] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('sync:catchup', ({ events }) => {
      console.log(`[Sync] Catchup received: ${events.length} events`);
      events.forEach((event: any) => this.applyEvent(event));
      localStorage.setItem('lastSyncTs', events[events.length - 1]?.server_ts || Date.now());
    });

    this.socket.on('sync:updateTimestamp', ({ serverTs }) => {
      localStorage.setItem('lastSyncTs', serverTs);
    });

    this.socket.on('sync:pull', (event: any) => {
      this.applyEvent(event);
    });
  }

  // 推送本地变更到服务器
  async push(entityType: string, entityId: string, operation: 'CREATE' | 'UPDATE' | 'DELETE', payload: any) {
    const event = {
      entityType,
      entityId,
      operation,
      payload,
      clientTs: Date.now(),
    };

    // 先写入本地（乐观更新）
    await this.writeLocal(entityId, payload, operation);

    if (this.isConnected && this.socket) {
      this.socket.emit('sync:push', event, (ack: any) => {
        if (ack.success) {
          localStorage.setItem('lastSyncedAt', ack.serverTs);
        } else if (ack.error === 'CONFLICT') {
          this.resolveConflict(entityId, payload, ack.serverVersion);
        }
      });
    } else {
      // 离线，加入队列
      this.pendingQueue.push(event);
      console.log('[Sync] Queued (offline):', entityId);
    }
  }

  private async writeLocal(entityId: string, payload: any, operation: string) {
    // TODO: 根据 entityType 写入对应的 Dexie 表
    // 阶段0：暂存到 localStorage，后续实现具体写入
    console.log('[Sync] writeLocal', { entityId, operation, payload });
  }

  private async flushPendingQueue() {
    while (this.pendingQueue.length > 0 && this.isConnected) {
      const event = this.pendingQueue.shift();
      await new Promise<void>((resolve) => {
        this.socket?.emit('sync:push', event, (ack: any) => {
          if (ack.success) {
            localStorage.setItem('lastSyncedAt', ack.serverTs);
          }
          resolve();
        });
      });
    }
  }

  private async resolveConflict(entityId: string, localPayload: any, serverVersion: any) {
    // 简单 LWW：比较 updatedAt 时间戳
    const serverTs = new Date(serverVersion.server_ts).getTime();
    const localTs = localPayload.updatedAt || 0;

    if (serverTs > localTs) {
      // 服务端版本较新，覆盖本地
      console.warn(`[Sync] Conflict resolved: server wins for ${entityId}`);
      await this.writeLocal(entityId, serverVersion.payload, 'UPDATE');
    } else {
      console.log(`[Sync] Conflict resolved: local wins for ${entityId}`);
      // 本地版本较新，无需操作（下次 push 会再次同步）
    }
  }

  private async applyEvent(event: any) {
    const { entity_id: entityId, operation, payload } = event;
    await this.writeLocal(entityId, payload, operation);
    localStorage.setItem('lastSyncedAt', event.server_ts || Date.now());

    // 触发全局事件通知 UI 更新
    window.dispatchEvent(new CustomEvent('couple:sync', { detail: event }));
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

// 全局单例（可选）
let syncInstance: CoupleSync | null = null;

export function getSyncInstance(): CoupleSync | null {
  return syncInstance;
}

export function initSync(token: string, coupleId: string): CoupleSync {
  if (!syncInstance) {
    syncInstance = new CoupleSync(token, coupleId);
    syncInstance.init();
  }
  return syncInstance;
}
