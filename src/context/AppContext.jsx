import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured, localStorageDB } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [studyRecords, setStudyRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

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
          console.log(`[加载数据] 从云端加载 ${data?.length || 0} 条记录`);
        } else {
          // 本地开发模式
          const records = await localStorageDB.getRecords();
          setStudyRecords(records);
          console.log(`[加载数据] 从本地加载 ${records.length} 条记录`);
        }
      } catch (error) {
        console.error('[加载数据] 失败:', error);
        setError(error.message);
        // Fallback 到本地存储
        const records = await localStorageDB.getRecords();
        setStudyRecords(records);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // 创建学习记录 - 强制云端模式
  const createStudyRecord = async (record) => {
    console.log('[创建学习记录] 开始:', record.title);
    
    const supabase = getSupabase();
    
    // 检查必要条件
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase 未配置，请检查环境变量');
    }
    
    if (!supabase) {
      throw new Error('Supabase 客户端初始化失败');
    }
    
    if (!user) {
      throw new Error('用户未登录，请先登录');
    }
    
    try {
      console.log('[创建学习记录] 使用云端模式，用户:', user.id);
      
      // 上传图片到 Storage（如果有）
      let imageUrl = null;
      if (record.sourceImage) {
        const timestamp = Date.now();
        const folderName = user.id;
        const fileName = `${timestamp}.jpg`;
        const fullPath = `${folderName}/${fileName}`;
        
        console.log('[创建学习记录] 上传图片:', fullPath);
        console.log('[创建学习记录] 文件夹:', folderName);
        console.log('[创建学习记录] 文件名:', fileName);
        
        // 将 base64 转换为 Blob
        let imageBlob;
        if (record.sourceImage.startsWith('data:')) {
          const base64Data = record.sourceImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
        } else {
          imageBlob = record.sourceImage;
        }
        
        console.log('[创建学习记录] 图片Blob大小:', imageBlob.size, 'bytes');
        
        // 先确保文件夹存在（列出文件夹内容）
        const { data: folderExists } = await supabase.storage
          .from('spelling-images')
          .list(folderName);
        
        console.log('[创建学习记录] 文件夹存在:', !!folderExists);
        
        // 上传文件
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('spelling-images')
          .upload(fullPath, imageBlob, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[创建学习记录] 图片上传失败:', uploadError.message);
          console.error('[创建学习记录] 上传错误详情:', uploadError);
          // 继续，不阻断流程
        } else {
          console.log('[创建学习记录] 图片上传成功:', uploadData);
          
          // 获取公共URL
          const { data: urlData } = supabase.storage
            .from('spelling-images')
            .getPublicUrl(fullPath);
          
          imageUrl = urlData.publicUrl;
          console.log('[创建学习记录] 图片URL:', imageUrl);
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
      
      console.log('[创建学习记录] 插入数据库:', dbRecord);

      // 保存到数据库
      const { data, error: insertError } = await supabase
        .from('study_records')
        .insert([dbRecord])
        .select()
        .single();
      
      if (insertError) {
        console.error('[创建学习记录] 数据库插入失败:', insertError);
        throw new Error(`数据库插入失败: ${insertError.message}`);
      }
      
      console.log('[创建学习记录] 成功，ID:', data.id);
      
      // 更新本地状态
      setStudyRecords(prev => [data, ...prev]);
      
      return data;
      
    } catch (error) {
      console.error('[创建学习记录] 错误:', error);
      throw error;
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
      console.error('[删除学习记录] 失败:', error);
      throw error;
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
    error,
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

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppProvider;