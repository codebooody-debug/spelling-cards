import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured, localStorageDB } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [studyRecords, setStudyRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 检查登录状态
  useEffect(() => {
    const supabase = getSupabase();
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabase();
      try {
        if (isSupabaseConfigured() && supabase && user) {
          // 从 Supabase 加载
          const { data, error } = await supabase
            .from('study_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setStudyRecords(data || []);
        } else {
          // 本地开发模式
          const records = await localStorageDB.getRecords();
          setStudyRecords(records);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // Fallback 到本地存储
        const records = await localStorageDB.getRecords();
        setStudyRecords(records);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // 创建学习记录
  const createStudyRecord = async (record) => {
    const newRecord = {
      id: `record-${Date.now()}`,
      ...record,
      createdAt: new Date().toISOString()
    };

    try {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase && user) {
        // 上传图片到 Storage（如果有）
        let imageUrl = null;
        if (record.sourceImage) {
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const { error } = await supabase.storage
            .from('spelling-images')
            .upload(fileName, record.sourceImage);
          
          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from('spelling-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        }

        // 保存到数据库
        const { data, error } = await supabase
          .from('study_records')
          .insert([{
            user_id: user.id,
            grade: record.grade,
            term: record.term,
            spelling_number: record.spellingNumber,
            subject: record.subject,
            title: record.title,
            source_image_url: imageUrl,
            content: record.content,
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        setStudyRecords([data, ...studyRecords]);
        return data;
      } else {
        // 本地模式
        setStudyRecords([newRecord, ...studyRecords]);
        await localStorageDB.saveRecord(newRecord);
        return newRecord;
      }
    } catch (error) {
      console.error('保存失败:', error);
      // Fallback 到本地
      setStudyRecords([newRecord, ...studyRecords]);
      await localStorageDB.saveRecord(newRecord);
      return newRecord;
    }
  };

  // 删除学习记录
  const deleteStudyRecord = async (recordId) => {
    try {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase && user) {
        const { error } = await supabase
          .from('study_records')
          .delete()
          .eq('id', recordId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      setStudyRecords(studyRecords.filter(r => r.id !== recordId));
      await localStorageDB.deleteRecord(recordId);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 获取特定年级学期的记录
  const getRecordsByGradeTerm = (grade, term) => {
    return studyRecords.filter(r => 
      r.grade === grade && 
      r.term === term
    );
  };

  // 获取所有年级分类
  const getGrades = () => {
    const grades = [...new Set(studyRecords.map(r => r.grade))];
    return grades.sort();
  };

  // 获取特定年级的所有记录
  const getRecordsByGrade = (grade) => {
    return studyRecords.filter(r => r.grade === grade);
  };

  // 登录
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) return { error: 'Supabase 未配置' };
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase 客户端未初始化' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // 注册
  const signUp = async (email, password) => {
    if (!isSupabaseConfigured()) return { error: 'Supabase 未配置' };
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase 客户端未初始化' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  // 登出
  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setStudyRecords([]);
  };

  const value = {
    studyRecords,
    isLoading,
    user,
    isSupabaseConfigured: isSupabaseConfigured(),
    createStudyRecord,
    deleteStudyRecord,
    getRecordsByGradeTerm,
    getGrades,
    getRecordsByGrade,
    signIn,
    signUp,
    signOut
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { // eslint-disable-line react-refresh/only-export-components
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppProvider;
