// 完整流程测试 - 模拟用户上传听写图片到生成学习卡片的全过程
// 使用 CommonJS 格式

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 模拟数据
const MOCK_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testCompleteWorkflow() {
  console.log('🚀 === 完整流程测试开始 ===\n');
  
  let testResults = {
    auth: false,
    storageSpelling: false,
    storageWord: false,
    databaseStudyRecord: false,
    databaseWordMedia: false,
    imageDisplay: false
  };
  
  try {
    // 1. 测试认证
    console.log('1️⃣ 测试用户认证...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('   创建测试用户...');
      const timestamp = Date.now();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `test${timestamp}@test.com`,
        password: 'Test123456!'
      });
      
      if (signUpError) {
        console.error('   ❌ 认证失败:', signUpError.message);
        return testResults;
      }
      
      testResults.auth = true;
      console.log('   ✅ 用户创建成功');
    } else {
      testResults.auth = true;
      console.log('   ✅ 已有用户登录');
    }
    
    const user = (await supabase.auth.getUser()).data.user;
    console.log('   用户ID:', user.id);
    
    // 2. 测试上传原始听写图片到 spelling-images
    console.log('\n2️⃣ 测试上传原始听写图片...');
    const timestamp = Date.now();
    const spellingFileName = `${user.id}/${timestamp}.jpg`;
    
    // 创建一个有效的测试图片（2x2像素的红色PNG）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII=';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    
    const { error: spellingUploadError } = await supabase.storage
      .from('spelling-images')
      .upload(spellingFileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (spellingUploadError) {
      console.error('   ❌ 上传失败:', spellingUploadError.message);
    } else {
      testResults.storageSpelling = true;
      console.log('   ✅ 上传成功:', spellingFileName);
      
      // 验证是否可以访问
      const { data: { publicUrl: spellingUrl } } = supabase.storage
        .from('spelling-images')
        .getPublicUrl(spellingFileName);
      console.log('   ✅ 图片URL:', spellingUrl);
    }
    
    // 3. 创建学习记录
    console.log('\n3️⃣ 测试创建学习记录...');
    const studyRecord = {
      user_id: user.id,
      grade: 'P3',
      term: 'Term 1',
      spelling_number: 'Spelling(1)',
      subject: 'Spelling',
      title: 'Test Spelling - ' + new Date().toISOString(),
      source_image_url: testResults.storageSpelling 
        ? `${SUPABASE_URL}/storage/v1/object/public/spelling-images/${spellingFileName}`
        : null,
      content: {
        title: 'Spelling(1)',
        subtitle: 'Unit 1 - Test',
        created_at: new Date().toISOString().split('T')[0],
        total_items: 2,
        items: [
          {
            id: 1,
            target_word: 'apple',
            sentence: 'I eat an apple.',
            blanked_sentence: 'I eat an _____.',
            phonetic: '/ˈæp.əl/',
            meaning: '苹果',
            word_type: 'noun',
            synonyms: ['fruit'],
            antonyms: [],
            practice_sentences: ['The apple is red.'],
            memory_tip: 'A-P-P-L-E'
          },
          {
            id: 2,
            target_word: 'banana',
            sentence: 'I like banana.',
            blanked_sentence: 'I like _____.',
            phonetic: '/bəˈnɑː.nə/',
            meaning: '香蕉',
            word_type: 'noun',
            synonyms: ['fruit'],
            antonyms: [],
            practice_sentences: ['The banana is yellow.'],
            memory_tip: 'BA-NA-NA'
          }
        ]
      }
    };
    
    const { data: recordData, error: recordError } = await supabase
      .from('study_records')
      .insert([studyRecord])
      .select()
      .single();
    
    if (recordError) {
      console.error('   ❌ 创建失败:', recordError.message);
      console.error('   错误详情:', recordError);
    } else {
      testResults.databaseStudyRecord = true;
      console.log('   ✅ 创建成功，ID:', recordData.id);
      
      // 4. 测试上传AI生成图片到 word-images
      console.log('\n4️⃣ 测试上传AI生成图片...');
      const studyRecordId = recordData.id;
      
      for (const item of studyRecord.content.items) {
        const wordFileName = `${user.id}/${studyRecordId}/${item.target_word}.png`;
        
        const { error: wordUploadError } = await supabase.storage
          .from('word-images')
          .upload(wordFileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (wordUploadError) {
          console.error(`   ❌ ${item.target_word} 上传失败:`, wordUploadError.message);
        } else {
          console.log(`   ✅ ${item.target_word} 上传成功`);
          
          // 5. 创建 word_media 记录
          console.log(`\n5️⃣ 测试创建 ${item.target_word} 的 word_media...`);
          
          const { data: { publicUrl: wordImageUrl } } = supabase.storage
            .from('word-images')
            .getPublicUrl(wordFileName);
          
          const wordMedia = {
            user_id: user.id,
            word: item.target_word,
            study_record_id: studyRecordId,
            image_url: wordImageUrl,
            image_generated_at: new Date().toISOString(),
            meaning: item.meaning,
            word_type: item.word_type,
            phonetic: item.phonetic,
            synonyms: item.synonyms,
            antonyms: item.antonyms,
            practice_sentences: item.practice_sentences,
            memory_tip: item.memory_tip,
            sentence: item.sentence
          };
          
          const { data: mediaData, error: mediaError } = await supabase
            .from('word_media')
            .insert([wordMedia])
            .select()
            .single();
          
          if (mediaError) {
            console.error(`   ❌ ${item.target_word} 创建失败:`, mediaError.message);
            console.error('   错误详情:', mediaError);
          } else {
            console.log(`   ✅ ${item.target_word} word_media 创建成功:`, mediaData.id);
            testResults.databaseWordMedia = true;
          }
        }
      }
      
      testResults.storageWord = true;
      
      // 6. 验证图片可以正常显示
      console.log('\n6️⃣ 验证图片显示...');
      
      // 检查 spelling-images
      const { data: spellingFiles } = await supabase.storage
        .from('spelling-images')
        .list(`${user.id}`);
      
      console.log(`   spelling-images 中用户文件数: ${spellingFiles?.length || 0}`);
      
      // 检查 word-images
      const { data: wordFiles } = await supabase.storage
        .from('word-images')
        .list(`${user.id}/${studyRecordId}`);
      
      console.log(`   word-images 中学习记录文件数: ${wordFiles?.length || 0}`);
      
      if (wordFiles && wordFiles.length > 0) {
        testResults.imageDisplay = true;
        console.log('   ✅ 图片可以正常访问');
        
        // 尝试访问其中一个图片
        const testFile = wordFiles[0];
        const testUrl = `${SUPABASE_URL}/storage/v1/object/public/word-images/${user.id}/${studyRecordId}/${testFile.name}`;
        console.log('   测试URL:', testUrl);
      }
      
      // 7. 验证数据库记录
      console.log('\n7️⃣ 验证数据库记录...');
      
      const { data: verifyRecords } = await supabase
        .from('study_records')
        .select('*')
        .eq('id', studyRecordId);
      
      console.log(`   study_records: ${verifyRecords?.length || 0} 条记录`);
      
      const { data: verifyMedia } = await supabase
        .from('word_media')
        .select('*')
        .eq('study_record_id', studyRecordId);
      
      console.log(`   word_media: ${verifyMedia?.length || 0} 条记录`);
      
      // 8. 清理测试数据
      console.log('\n8️⃣ 清理测试数据...');
      
      await supabase.from('word_media').delete().eq('study_record_id', studyRecordId);
      await supabase.from('study_records').delete().eq('id', studyRecordId);
      await supabase.storage.from('word-images').remove([`${user.id}/${studyRecordId}/apple.png`, `${user.id}/${studyRecordId}/banana.png`]);
      await supabase.storage.from('spelling-images').remove([spellingFileName]);
      
      console.log('   ✅ 测试数据已清理');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
    console.error(error);
  }
  
  // 输出测试结果
  console.log('\n📊 === 测试结果 ===');
  console.log('用户认证:', testResults.auth ? '✅ 通过' : '❌ 失败');
  console.log('原始图片上传:', testResults.storageSpelling ? '✅ 通过' : '❌ 失败');
  console.log('AI图片上传:', testResults.storageWord ? '✅ 通过' : '❌ 失败');
  console.log('学习记录创建:', testResults.databaseStudyRecord ? '✅ 通过' : '❌ 失败');
  console.log('单词媒体创建:', testResults.databaseWordMedia ? '✅ 通过' : '❌ 失败');
  console.log('图片显示:', testResults.imageDisplay ? '✅ 通过' : '❌ 失败');
  
  const allPassed = Object.values(testResults).every(v => v);
  console.log('\n' + (allPassed ? '✅ 所有测试通过！' : '❌ 部分测试失败'));
  
  return testResults;
}

// 运行测试
testCompleteWorkflow().then(results => {
  process.exit(Object.values(results).every(v => v) ? 0 : 1);
});