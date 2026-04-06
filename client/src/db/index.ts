import Dexie, { type EntityTable } from 'dexie';

// ==================== 数据模型定义 ====================

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Couple {
  id: string;
  partner_a_id: string;
  partner_b_id?: string;
  status: 'pending' | 'active' | 'dissolved';
  activated_at?: string;
  partner_a_name?: string;
  partner_b_name?: string;
}

export interface Task {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  category: 'venue' | 'catering' | 'photography' | 'videography' | 'makeup' |
            'dress' | 'rings' | 'florals' | 'lighting' | 'sound' |
            'favors' | 'invitation' | 'transportation' | 'accommodation' | 'other';
  status: 'todo' | 'in_progress' | 'done';
  assignee_id?: string;
  due_date?: number; // Unix timestamp
  priority: 'low' | 'medium' | 'high';
  subtasks?: Subtask[];
  attachments?: Attachment[];
  updatedAt: number;
  _deleted?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  estimated_budget: number;
  actual_spent: number;
  paid: number;
}

export interface BudgetItem {
  id: string;
  couple_id: string;
  category_id: string;
  vendor: string;
  estimated_cost: number;
  actual_cost?: number;
  paid: boolean;
  payment_date?: number;
  payment_method?: string;
  notes?: string;
  updatedAt: number;
  _deleted?: boolean;
}

export interface Guest {
  id: string;
  couple_id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  table_id?: string;
  plus_one: boolean;
  plus_one_name?: string;
  notes?: string;
  updatedAt: number;
  _deleted?: boolean;
}

export interface SeatingTable {
  id: string;
  couple_id: string;
  name: string; // 桌号，如 "Table 1", "主桌"
  max_seats: number;
  guests: string[]; // guest ids
  updatedAt: number;
  _deleted?: boolean;
}

export interface Mood {
  id: string;
  couple_id: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  text?: string;
  updatedAt: number;
  _deleted?: boolean;
}

export interface Memory {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  media_urls: string[];
  tags: string[];
  captured_at: number;
  created_at: number;
  updatedAt: number;
  _deleted?: boolean;
}

export interface Gift {
  id: string;
  couple_id: string;
  guest_id?: string;
  guest_name: string;
  type: 'received' | 'given';
  amount: number;
  date: number;
  notes?: string;
  updatedAt: number;
  _deleted?: boolean;
}

export interface SyncMeta {
  id: 'singleton';
  lastSyncedAt: number;
  clientId: string;
  coupleId?: string;
}

export interface AIConfig {
  id: string;
  couple_id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== Dexie 数据库实例 ====================

export const db = new Dexie('WeddingPlannerDB') as Dexie & {
  users: EntityTable<User, 'id'>;
  couples: EntityTable<Couple, 'id'>;
  tasks: EntityTable<Task, 'id'>;
  budgetItems: EntityTable<BudgetItem, 'id'>;
  guests: EntityTable<Guest, 'id'>;
  tables: EntityTable<SeatingTable, 'id'>;
  moods: EntityTable<Mood, 'id'>;
  memories: EntityTable<Memory, 'id'>;
  gifts: EntityTable<Gift, 'id'>;
  syncMeta: EntityTable<SyncMeta, 'id'>;
  aiConfigs: EntityTable<AIConfig, 'id'>;
};

db.version(1).stores({
  users: 'id, email, name',
  couples: 'id, partner_a_id, partner_b_id, status',
  tasks: '++id, couple_id, status, category, assignee_id, due_date, updatedAt, _deleted',
  budgetItems: '++id, couple_id, category_id, updatedAt, _deleted',
  guests: '++id, couple_id, rsvp_status, table_id, updatedAt, _deleted',
  tables: '++id, couple_id, updatedAt, _deleted',
  moods: '++id, couple_id, date, updatedAt, _deleted',
  memories: '++id, couple_id, captured_at, updatedAt, _deleted',
  gifts: '++id, couple_id, guest_id, date, updatedAt, _deleted',
  syncMeta: 'id',
  aiConfigs: '++id, couple_id, updatedAt',
});
