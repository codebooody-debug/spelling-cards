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
    console.log('[创建学习记录] 开始:', record.title);
    
    const newRecord = {
      id: `record-${Date.now()}`,
      ...record,
      createdAt: new Date().toISOString()
    };

    try {
      const supabase = getSupabase();
      const configured = isSupabaseConfigured();
      const hasUser = !!user;
      
      console.log('[创建学习记录] 检查:', {
        supabaseConfigured: configured,
        hasUser: hasUser,
        hasSupabaseClient: !!supabase
      });
      
      if (configured && supabase && hasUser) {
        console.log('[创建学习记录] 使用云端模式');
        
        // 上传图片到 Storage（如果有）
        let imageUrl = null;
        if (record.sourceImage) {
          const fileName = `${user.id}/${Date.now()}.jpg`;
          console.log('[创建学习记录] 上传图片:', fileName);
          
          const { error: uploadError } = await supabase.storage
            .from('spelling-images')
            .upload(fileName, record.sourceImage);
          
          if (uploadError) {
            console.error('[创建学习记录] 图片上传失败:', uploadError.message);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('spelling-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
            console.log('[创建学习记录] 图片上传成功:', imageUrl);
          }
        }

        // 准备数据库记录
        const dbRecord = {
          user_id: user.id,
          grade: record.grade,
          term: record.term,
          spelling_number: record.spellingNumber,
          subject: record.subject,
          title: record.title,
          source_image_url: imageUrl,
          content: record.content,
        };
        
        console.log('[创建学习记录] 准备插入数据库:', dbRecord);

        // 保存到数据库
        const { data, error } = await supabase
          .from('study_records')
          .insert([dbRecord])
          .select()
          .single();
        
        if (error) {
          console.error('[创建学习记录] 数据库插入失败:', error.message);
          throw error;
        }
        
        console.log('[创建学习记录] 数据库插入成功:', data.id);
        
        setStudyRecords([data, ...studyRecords]);
        return data;
      } else {
        console.log('[创建学习记录] 使用本地模式 (无法跨设备同步)');
        // 本地模式
        setStudyRecords([newRecord, ...studyRecords]);
        await localStorageDB.saveRecord(newRecord);
        return newRecord;
      }
    } catch (error) {
      console.error('[创建学习记录] 错误:', error.message);
      console.error('[创建学习记录] 错误详情:', error);
      
      // 显示错误给用户，而不是静默fallback
      throw new Error(`保存学习记录失败: ${error.message}`);
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
