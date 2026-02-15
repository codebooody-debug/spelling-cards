// 简化测试 - 检查Storage和Database配置
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConfiguration() {
  console.log('🔍 === 检查Supabase配置 ===\n');
  
  // 1. 检查存储桶
  console.log('1️⃣ 检查Storage Buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('   ❌ 无法列出buckets:', bucketError.message);
  } else {
    console.log(`   ✅ 找到 ${buckets.length} 个buckets:`);
    buckets.forEach(b => {
      console.log(`      - ${b.name} (Public: ${b.public})`);
    });
  }
  
  // 2. 检查数据库表
  console.log('\n2️⃣ 检查数据库表...');
  
  // 检查 study_records
  const { data: studyRecords, error: studyError } = await supabase
    .from('study_records')
    .select('id')
    .limit(1);
  
  if (studyError) {
    console.error('   ❌ study_records 表错误:', studyError.message);
  } else {
    console.log('   ✅ study_records 表可访问');
  }
  
  // 检查 word_media
  const { data: wordMedia, error: mediaError } = await supabase
    .from('word_media')
    .select('id')
    .limit(1);
  
  if (mediaError) {
    console.error('   ❌ word_media 表错误:', mediaError.message);
  } else {
    console.log('   ✅ word_media 表可访问');
  }
  
  // 3. 检查RLS策略
  console.log('\n3️⃣ 检查表统计...');
  
  const { count: studyCount } = await supabase
    .from('study_records')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   study_records 记录数: ${studyCount || 0}`);
  
  const { count: mediaCount } = await supabase
    .from('word_media')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   word_media 记录数: ${mediaCount || 0}`);
  
  // 4. 检查Storage中的文件
  console.log('\n4️⃣ 检查Storage中的文件...');
  
  // 检查 spelling-images
  const { data: spellingFiles, error: spellingListError } = await supabase.storage
    .from('spelling-images')
    .list();
  
  if (spellingListError) {
    console.error('   ❌ 无法列出spelling-images:', spellingListError.message);
  } else {
    console.log(`   spelling-images 文件数: ${spellingFiles?.length || 0}`);
    if (spellingFiles && spellingFiles.length > 0) {
      console.log('   文件列表:');
      spellingFiles.slice(0, 5).forEach(f => console.log(`      - ${f.name}`));
    }
  }
  
  // 检查 word-images
  const { data: wordFiles, error: wordListError } = await supabase.storage
    .from('word-images')
    .list();
  
  if (wordListError) {
    console.error('   ❌ 无法列出word-images:', wordListError.message);
  } else {
    console.log(`   word-images 文件数: ${wordFiles?.length || 0}`);
    if (wordFiles && wordFiles.length > 0) {
      console.log('   文件列表:');
      wordFiles.slice(0, 5).forEach(f => console.log(`      - ${f.name}`));
    }
  }
  
  console.log('\n✅ 配置检查完成');
}

checkConfiguration().catch(console.error);