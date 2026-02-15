import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Settings, Trash2, Database, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { getCacheStats } from '../services/imageCache';

export default function AdminPage() {
  const navigate = useNavigate();
  const { clearLocalCache, deleteStudyRecord, studyRecords } = useApp();
  const { success, error: showError } = useToast();
  const [cacheStats, setCacheStats] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // 获取缓存统计
  const checkCacheStats = async () => {
    setIsChecking(true);
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
      success('缓存统计获取成功');
    } catch (err) {
      showError('获取缓存统计失败: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  // 清理本地缓存
  const handleClearLocalCache = async () => {
    if (!confirm('确定要清除所有本地缓存吗？这将删除浏览器中存储的所有图片缓存。')) {
      return;
    }
    
    setIsClearing(true);
    try {
      const result = await clearLocalCache();
      if (result.success) {
        success('本地缓存已清除');
        setCacheStats(null); // 重置统计数据
      } else {
        showError('清除缓存失败: ' + result.error);
      }
    } catch (err) {
      showError('清除缓存失败: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  // 清理所有数据
  const handleClearAllData = async () => {
    if (!confirm('⚠️ 警告：这将删除所有学习记录和相关数据，包括云端数据和本地缓存，确定要继续吗？')) {
      return;
    }
    
    try {
      // 删除所有记录（这会触发级联删除）
      for (const record of studyRecords) {
        await deleteStudyRecord(record.id);
      }
      
      // 清除本地缓存
      await clearLocalCache();
      
      success('所有数据已清除');
      navigate('/');
    } catch (err) {
      showError('清除数据失败: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M9 18l-6-6 6-6"/>
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">管理面板</h1>
                <p className="text-sm text-gray-500">数据管理和维护</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full py-8">
        <div className="max-w-[800px] mx-auto px-4 space-y-6">
          
          {/* 缓存管理 */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <HardDrive size={20} />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">本地缓存管理</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">浏览器缓存</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Database size={20} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">图片缓存</p>
                      <p className="text-sm text-gray-500">存储在浏览器中的单词图片</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {cacheStats ? `${cacheStats.count}/${cacheStats.maxSize}` : '点击检查'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cacheStats?.storage || '-'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={checkCacheStats}
                    disabled={isChecking}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isChecking ? '检查中...' : '检查缓存状态'}
                  </button>
                  
                  <button
                    onClick={handleClearLocalCache}
                    disabled={isClearing}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isClearing ? '清除中...' : '清除缓存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 数据管理 */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">危险操作</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">数据清理</h3>
              <p className="text-sm text-gray-500 mb-4">彻底清除所有数据，包括云端和本地</p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">警告</p>
                    <p className="text-sm text-red-600 mt-1">
                      此操作将永久删除所有学习记录、单词媒体以及本地缓存。
                      此操作不可撤销。
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleClearAllData}
                  className="w-full mt-4 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  清除所有数据
                </button>
              </div>
            </div>
          </div>
          
          {/* 当前数据统计 */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">当前数据统计</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">学习记录</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{studyRecords.length}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.3-4.3"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">总单词数</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {studyRecords.reduce((sum, record) => sum + (record.content?.items?.length || 0), 0)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <path d="M21 12V7H5a2 2 0 0 1-2-2V2"/>
                        <path d="M 3 12 H 21 V 7"/>
                        <path d="M 3 17 H 21 V 22"/>
                        <path d="M12 3v18"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">总课时</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(studyRecords.map(r => `${r.grade}-${r.term}`)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}