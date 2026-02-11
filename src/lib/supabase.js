import { createClient } from '@supabase/supabase-js';

// 从环境变量读取（部署后设置）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 本地开发时使用 localStorage 作为 fallback
const isDevelopment = !supabaseUrl || !supabaseKey;

export const supabase = isDevelopment 
  ? null 
  : createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = () => !isDevelopment;

// 本地存储 fallback（开发时使用）
export const localStorageDB = {
  async getRecords() {
    const data = localStorage.getItem('studyRecords');
    return data ? JSON.parse(data) : [];
  },
  
  async saveRecord(record) {
    const records = await this.getRecords();
    records.unshift(record);
    localStorage.setItem('studyRecords', JSON.stringify(records));
    return record;
  },
  
  async deleteRecord(id) {
    const records = await this.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem('studyRecords', JSON.stringify(filtered));
  }
};
