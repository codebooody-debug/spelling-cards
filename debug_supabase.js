// 调试脚本：检查 Supabase 数据库操作
// 在浏览器控制台运行此代码来诊断问题

async function debugSupabase() {
  console.log('=== Supabase 调试开始 ===\n');
  
  // 1. 检查配置
  console.log('1. 检查 Supabase 配置:');
  const url = import.meta.env?.VITE_SUPABASE_URL || '未设置';
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置';
  console.log(`   URL: ${url}`);
  console.log(`   Key: ${key}`);
  
  // 2. 检查用户登录状态
  console.log('\n2. 检查用户登录状态:');
  const supabase = window.supabaseClient || (await import('../src/lib/supabase.js')).getSupabase();
  if (!supabase) {
    console.error('   ❌ Supabase 客户端未初始化');
    return;
  }
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('   ❌ 获取用户失败:', userError.message);
  } else if (user) {
    console.log('   ✅ 用户已登录:', user.id);
  } else {
    console.error('   ❌ 用户未登录');
    return;
  }
  
  // 3. 检查 study_records 表
  console.log('\n3. 检查 study_records 表:');
  const { data: records, error: recordsError } = await supabase
    .from('study_records')
    .select('*')
    .limit(5);
  
  if (recordsError) {
    console.error('   ❌ 查询失败:', recordsError.message);
  } else {
    console.log(`   ✅ 找到 ${records.length} 条记录`);
    if (records.length > 0) {
      console.log('   最新记录:', {
        id: records[0].id,
        title: records[0].title,
        created_at: records[0].created_at
      });
    }
  }
  
  // 4. 检查 word_media 表
  console.log('\n4. 检查 word_media 表:');
  const { data: media, error: mediaError } = await supabase
    .from('word_media')
    .select('*')
    .limit(5);
  
  if (mediaError) {
    console.error('   ❌ 查询失败:', mediaError.message);
  } else {
    console.log(`   ✅ 找到 ${media.length} 条记录`);
    if (media.length > 0) {
      console.log('   最新记录:', {
        id: media[0].id,
        word: media[0].word,
        image_url: media[0].image_url ? '有' : '无'
      });
    }
  }
  
  // 5. 检查 Storage buckets
  console.log('\n5. 检查 Storage buckets:');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('   ❌ 查询失败:', bucketsError.message);
  } else {
    console.log(`   ✅ 找到 ${buckets.length} 个存储桶:`);
    buckets.forEach(bucket => {
      console.log(`      - ${bucket.name} (Public: ${bucket.public})`);
    });
  }
  
  // 6. 测试插入 word_media
  console.log('\n6. 测试插入 word_media 记录:');
  if (records.length > 0) {
    const testRecord = {
      user_id: user.id,
      word: 'test-debug',
      study_record_id: records[0].id,
      image_url: 'https://example.com/test.png',
      meaning: '测试',
      word_type: 'noun',
      phonetic: '/test/',
      synonyms: [],
      antonyms: [],
      practice_sentences: [],
      memory_tip: '测试记忆技巧',
      sentence: 'This is a test.'
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('word_media')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('   ❌ 插入失败:', insertError.message);
      console.error('   错误详情:', insertError);
    } else {
      console.log('   ✅ 插入成功:', inserted.id);
      
      // 删除测试记录
      await supabase.from('word_media').delete().eq('id', inserted.id);
      console.log('   ✅ 测试记录已删除');
    }
  }
  
  console.log('\n=== 调试结束 ===');
}

// 运行调试
debugSupabase().catch(console.error);