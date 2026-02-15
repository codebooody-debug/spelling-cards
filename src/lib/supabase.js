import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 检查 Supabase 是否配置
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};

// 获取 Supabase 客户端
export const getSupabase = () => supabase;

// 本地存储 fallback
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
  },

  async clearAll() {
    localStorage.removeItem('studyRecords');
    console.log('[localStorageDB] 本地存储已清除');
  }
};