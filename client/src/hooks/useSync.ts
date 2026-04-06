import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/index';
import { initSync } from '../sync/syncClient';

export function useSync() {
  const [lastSync, setLastSync] = useState<number>(0);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    // 从本地存储读取 lastSyncTs
    const ts = Number(localStorage.getItem('lastSyncedAt') || 0);
    setLastSync(ts);

    // 监听全局同步事件
    const handleSync = () => {
      const newTs = Number(localStorage.getItem('lastSyncedAt') || Date.now());
      setLastSync(newTs);
    };

    window.addEventListener('couple:sync', handleSync);
    return () => window.removeEventListener('couple:sync', handleSync);
  }, []);

  return {
    lastSync,
    coupleId,
    setCoupleId,
  };
}

/**
 * 初始化同步（需在登录后调用）
 * 注意：这是一个独立的函数，不是 hook！
 */
let syncInitialized = false;
let currentCoupleId: string | null = null;

export function initializeSync(token: string, coupleId: string) {
  if (syncInitialized && currentCoupleId === coupleId) {
    return; // Already initialized for this couple
  }

  initSync(token, coupleId);
  syncInitialized = true;
  currentCoupleId = coupleId;
}

/**
 * 通用 useLiveQuery 包装器，带 couple 过滤
 */
export function useLiveTasks(coupleId: string) {
  return useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray(),
    [coupleId]
  );
}

export function useLiveGuests(coupleId: string) {
  return useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted)
        .toArray(),
    [coupleId]
  );
}

export function useLiveBudget(coupleId: string) {
  return useLiveQuery(
    () =>
      db.budgetItems
        .where('couple_id')
        .equals(coupleId)
        .and((b) => !b._deleted)
        .toArray(),
    [coupleId]
  );
}

export function useLiveMoods(coupleId: string) {
  return useLiveQuery(
    () =>
      db.moods
        .where('couple_id')
        .equals(coupleId)
        .and((m) => !m._deleted)
        .toArray(),
    [coupleId]
  );
}
