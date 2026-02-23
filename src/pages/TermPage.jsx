import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, FileText, Trash2, Eye, BookOpen } from 'lucide-react';

export default function TermPage() {
  const { gradeId, termId } = useParams();
  const navigate = useNavigate();
  const { getRecordsByGradeTerm, deleteStudyRecord } = useApp();

  const records = getRecordsByGradeTerm(gradeId, termId);

  const handleDeleteRecord = (recordId) => {
    if (confirm('确定要删除这个听写记录吗？')) {
      deleteStudyRecord(recordId);
    }
  };

  // 按听写编号分组
  const groupedRecords = records.reduce((groups, record) => {
    const key = record.spellingNumber || '未分类';
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg"><BookOpen className="text-white" size={24} /></div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{gradeId} · {termId}</h1>
                <p className="text-sm text-gray-500">{records.length} 个听写记录</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full py-8">
        <div className="max-w-[1400px] mx-auto px-4">
          {records.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedRecords).map(([spellingNumber, groupRecords]) => (
                <div key={spellingNumber}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">{spellingNumber.match(/\d+/)?.[0] || '?'}</span>
                    {spellingNumber}
                    <span className="text-sm font-normal text-gray-500">({groupRecords.length} 个记录)</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupRecords.map((record) => (
                      <div key={record.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        {record.sourceImage && (
                          <div className="h-32 bg-gray-100 overflow-hidden">
                            <img src={record.sourceImage} alt="Source" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800 line-clamp-1">{record.content?.subtitle || record.title}</h3>
                              <p className="text-sm text-gray-500">{record.content?.total_items || 0} 个单词</p>
                            </div>
                            <FileText size={20} className="text-blue-500 shrink-0" />
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-4">{new Date(record.createdAt).toLocaleDateString()}</p>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/study/${record.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Eye size={16} />学习
                            </button>
                            
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无听写记录</h3>
              <p className="text-gray-500 mb-6">返回首页上传听写照片开始学习</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">去上传</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
