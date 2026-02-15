// 环境配置验证测试
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyEnvironment() {
  console.log('🔍 === 环境配置验证 ===\n');
  
  // 1. 验证Supabase连接
  console.log('1️⃣ 验证Supabase连接...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('   ⚠️  无法列出buckets (需要管理员权限):', error.message);
    } else {
      console.log('   ✅ 连接成功');
    }
  } catch (e) {
    console.log('   ⚠️  连接测试:', e.message);
  }
  
  // 2. 验证Storage Buckets存在
  console.log('\n2️⃣ 验证Storage Buckets...');
  
  // 测试spelling-images
  try {
    const { data: spellingFiles } = await supabase.storage
      .from('spelling-images')
      .list();
    console.log('   ✅ spelling-images: 可访问');
    console.log(`      文件数: ${spellingFiles?.length || 0}`);
  } catch (e) {
    console.log('   ❌ spelling-images:', e.message);
  }
  
  // 测试word-images
  try {
    const { data: wordFiles } = await supabase.storage
      .from('word-images')
      .list();
    console.log('   ✅ word-images: 可访问');
    console.log(`      文件数: ${wordFiles?.length || 0}`);
  } catch (e) {
    console.log('   ❌ word-images:', e.message);
  }
  
  // 3. 验证数据库表
  console.log('\n3️⃣ 验证数据库表...');
  
  // 测试study_records
  try {
    const { count: studyCount, error: studyError } = await supabase
      .from('study_records')
      .select('*', { count: 'exact', head: true });
    
    if (studyError) {
      console.log('   ❌ study_records:', studyError.message);
    } else {
      console.log('   ✅ study_records: 可访问');
      console.log(`      记录数: ${studyCount || 0}`);
    }
  } catch (e) {
    console.log('   ❌ study_records:', e.message);
  }
  
  // 测试word_media
  try {
    const { count: mediaCount, error: mediaError } = await supabase
      .from('word_media')
      .select('*', { count: 'exact', head: true });
    
    if (mediaError) {
      console.log('   ❌ word_media:', mediaError.message);
    } else {
      console.log('   ✅ word_media: 可访问');
      console.log(`      记录数: ${mediaCount || 0}`);
    }
  } catch (e) {
    console.log('   ❌ word_media:', e.message);
  }
  
  // 4. 验证Edge Functions
  console.log('\n4️⃣ 验证Edge Functions...');
  const functions = [
    'extract-spelling',
    'enrich-word',
    'generate-image'
  ];
  
  for (const func of functions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'OPTIONS'
      });
      if (response.ok || response.status === 204) {
        console.log(`   ✅ ${func}: 可访问`);
      } else {
        console.log(`   ⚠️  ${func}: HTTP ${response.status}`);
      }
    } catch (e) {
      console.log(`   ❌ ${func}: ${e.message}`);
    }
  }
  
  // 5. 检查现有数据
  console.log('\n5️⃣ 检查现有数据...');
  
  // 检查spelling-images中的文件
  try {
    const { data: spellingRoot } = await supabase.storage
      .from('spelling-images')
      .list();
    
    if (spellingRoot && spellingRoot.length > 0) {
      console.log('   spelling-images 内容:');
      for (const item of spellingRoot.slice(0, 3)) {
        console.log(`      - ${item.name}`);
      }
    } else {
      console.log('   spelling-images: 空');
    }
  } catch (e) {
    console.log('   spelling-images: 无法访问');
  }
  
  // 检查word-images中的文件
  try {
    const { data: wordRoot } = await supabase.storage
      .from('word-images')
      .list();
    
    if (wordRoot && wordRoot.length > 0) {
      console.log('   word-images 内容:');
      for (const item of wordRoot.slice(0, 3)) {
        console.log(`      - ${item.name}`);
      }
    } else {
      console.log('   word-images: 空');
    }
  } catch (e) {
    console.log('   word-images: 无法访问');
  }
  
  console.log('\n✅ 环境验证完成');
}

verifyEnvironment();