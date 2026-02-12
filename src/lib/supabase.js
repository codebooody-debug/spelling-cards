import { createClient } from '@supabase/supabase-js';

// 从环境变量读取（部署后设置）
const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL || '';
const getSupabaseKey = () => import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 延迟创建客户端，确保环境变量已加载
let supabaseClient = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseKey();
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
};

// 为了兼容性，保留 supabase 导出
export const supabase = getSupabase();

// 运行时检测配置状态
export const isSupabaseConfigured = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const configured = !!(url && key);
  console.log(`[isSupabaseConfigured] URL: ${url ? '已设置' : '未设置'}, Key: ${key ? '已设置' : '未设置'}, 结果: ${configured}`);
  return configured;
};

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
