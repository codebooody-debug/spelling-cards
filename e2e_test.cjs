// 完整端到端测试 - 验证所有环节
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试用的简单图片 (1x1像素透明PNG)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runFullTest() {
  console.log('🧪 === 完整端到端测试 ===\n');
  
  const results = {
    auth: { status: 'PENDING', details: '' },
    storageSpelling: { status: 'PENDING', details: '' },
    storageWord: { status: 'PENDING', details: '' },
    databaseStudyRecord: { status: 'PENDING', details: '' },
    databaseWordMedia: { status: 'PENDING', details: '' },
    imageAccess: { status: 'PENDING', details: '' }
  };
  
  let testUser = null;
  let testRecordId = null;
  let testImageUrls = {};
  
  try {
    // 1. 认证测试
    console.log('1️⃣ 认证测试...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      results.auth = { status: 'FAILED', details: '未登录: ' + (authError?.message || '无会话') };
      console.log('   ❌', results.auth.details);
      return results;
    }
    
    testUser = session.user;
    results.auth = { status: 'PASSED', details: `用户: ${testUser.id.substring(0, 8)}...` };
    console.log('   ✅', results.auth.details);
    
    // 2. 测试上传原始图片到 spelling-images
    console.log('\n2️⃣ 测试 spelling-images 上传...');
    const timestamp = Date.now();
    const spellingFolder = testUser.id;
    const spellingFile = `${timestamp}.jpg`;
    const spellingPath = `${spellingFolder}/${spellingFile}`;
    
    const imageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    
    const { error: spellingError } = await supabase.storage
      .from('spelling-images')
      .upload(spellingPath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (spellingError) {
      results.storageSpelling = { status: 'FAILED', details: spellingError.message };
      console.log('   ❌', results.storageSpelling.details);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('spelling-images')
        .getPublicUrl(spellingPath);
      
      testImageUrls.spelling = publicUrl;
      results.storageSpelling = { 
        status: 'PASSED', 
        details: `上传成功: ${spellingPath}` 
      };
      console.log('   ✅', results.storageSpelling.details);
      console.log('   📎 URL:', publicUrl);
    }
    
    // 3. 创建学习记录
    console.log('\n3️⃣ 测试创建 study_records...');
    const studyRecord = {
      user_id: testUser.id,
      grade: 'P3',
      term: 'Term 1',
      spelling_number: 'Test-Spelling',
      subject: 'Spelling',
      title: 'E2E Test - ' + new Date().toLocaleString(),
      source_image_url: testImageUrls.spelling || null,
      content: {
        title: 'Test',
        total_items: 2,
        items: [
          { word: 'apple', meaning: '苹果' },
          { word: 'book', meaning: '书' }
        ]
      }
    };
    
    const { data: recordData, error: recordError } = await supabase
      .from('study_records')
      .insert([studyRecord])
      .select()
      .single();
    
    if (recordError) {
      results.databaseStudyRecord = { status: 'FAILED', details: recordError.message };
      console.log('   ❌', results.databaseStudyRecord.details);
    } else {
      testRecordId = recordData.id;
      results.databaseStudyRecord = { 
        status: 'PASSED', 
        details: `创建成功: ${testRecordId.substring(0, 8)}...` 
      };
      console.log('   ✅', results.databaseStudyRecord.details);
    }
    
    // 4. 测试上传AI图片到 word-images
    console.log('\n4️⃣ 测试 word-images 上传...');
    if (testRecordId) {
      const wordFolder = `${testUser.id}/${testRecordId}`;
      const wordFile = 'apple.png';
      const wordPath = `${wordFolder}/${wordFile}`;
      
      const { error: wordError } = await supabase.storage
        .from('word-images')
        .upload(wordPath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (wordError) {
        results.storageWord = { status: 'FAILED', details: wordError.message };
        console.log('   ❌', results.storageWord.details);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('word-images')
          .getPublicUrl(wordPath);
        
        testImageUrls.word = publicUrl;
        results.storageWord = { 
          status: 'PASSED', 
          details: `上传成功: ${wordPath}` 
        };
        console.log('   ✅', results.storageWord.details);
        console.log('   📎 URL:', publicUrl);
      }
    } else {
      results.storageWord = { status: 'SKIPPED', details: '无学习记录ID' };
      console.log('   ⏭️', results.storageWord.details);
    }
    
    // 5. 创建 word_media 记录
    console.log('\n5️⃣ 测试创建 word_media...');
    if (testRecordId && testImageUrls.word) {
      const wordMedia = {
        user_id: testUser.id,
        word: 'apple',
        study_record_id: testRecordId,
        image_url: testImageUrls.word,
        image_generated_at: new Date().toISOString(),
        meaning: '苹果',
        word_type: 'noun',
        phonetic: '/ˈæp.əl/',
        synonyms: ['fruit'],
        antonyms: [],
        practice_sentences: ['I eat an apple.'],
        memory_tip: 'A-P-P-L-E',
        sentence: 'I eat an apple every day.'
      };
      
      const { data: mediaData, error: mediaError } = await supabase
        .from('word_media')
        .insert([wordMedia])
        .select()
        .single();
      
      if (mediaError) {
        results.databaseWordMedia = { status: 'FAILED', details: mediaError.message };
        console.log('   ❌', results.databaseWordMedia.details);
      } else {
        results.databaseWordMedia = { 
          status: 'PASSED', 
          details: `创建成功: ${mediaData.id.substring(0, 8)}...` 
        };
        console.log('   ✅', results.databaseWordMedia.details);
      }
    } else {
      results.databaseWordMedia = { status: 'SKIPPED', details: '前置条件不满足' };
      console.log('   ⏭️', results.databaseWordMedia.details);
    }
    
    // 6. 验证图片可访问
    console.log('\n6️⃣ 验证图片可访问性...');
    if (testImageUrls.word) {
      try {
        const response = await fetch(testImageUrls.word, { method: 'HEAD' });
        if (response.ok) {
          results.imageAccess = { 
            status: 'PASSED', 
            details: '图片URL可访问 (HTTP 200)' 
          };
          console.log('   ✅', results.imageAccess.details);
        } else {
          results.imageAccess = { 
            status: 'FAILED', 
            details: `HTTP ${response.status}` 
          };
          console.log('   ❌', results.imageAccess.details);
        }
      } catch (e) {
        results.imageAccess = { status: 'FAILED', details: e.message };
        console.log('   ❌', results.imageAccess.details);
      }
    } else {
      results.imageAccess = { status: 'SKIPPED', details: '无图片URL' };
      console.log('   ⏭️', results.imageAccess.details);
    }
    
    // 7. 验证数据库记录
    console.log('\n7️⃣ 验证数据库记录...');
    if (testRecordId) {
      const { data: verifyRecords } = await supabase
        .from('study_records')
        .select('*')
        .eq('id', testRecordId);
      
      console.log(`   study_records: ${verifyRecords?.length || 0} 条`);
      
      const { data: verifyMedia } = await supabase
        .from('word_media')
        .select('*')
        .eq('study_record_id', testRecordId);
      
      console.log(`   word_media: ${verifyMedia?.length || 0} 条`);
    }
    
    // 8. 清理测试数据
    console.log('\n8️⃣ 清理测试数据...');
    if (testRecordId) {
      await supabase.from('word_media').delete().eq('study_record_id', testRecordId);
      await supabase.from('study_records').delete().eq('id', testRecordId);
    }
    if (testImageUrls.spelling) {
      await supabase.storage.from('spelling-images').remove([spellingPath]);
    }
    if (testImageUrls.word) {
      await supabase.storage.from('word-images').remove([`${testUser.id}/${testRecordId}/apple.png`]);
    }
    console.log('   ✅ 测试数据已清理');
    
  } catch (error) {
    console.error('\n❌ 测试异常:', error.message);
  }
  
  // 输出测试报告
  console.log('\n📊 === 测试报告 ===');
  console.log('');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.status === 'PASSED').length;
  const failedTests = Object.values(results).filter(r => r.status === 'FAILED').length;
  const skippedTests = Object.values(results).filter(r => r.status === 'SKIPPED').length;
  
  Object.entries(results).forEach(([name, result]) => {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
    console.log(`${icon} ${name}: ${result.status}`);
    console.log(`   ${result.details}`);
    console.log('');
  });
  
  console.log('📈 统计:');
  console.log(`   总计: ${totalTests} | 通过: ${passedTests} | 失败: ${failedTests} | 跳过: ${skippedTests}`);
  console.log('');
  
  if (failedTests === 0 && passedTests > 0) {
    console.log('🎉 所有测试通过！系统正常工作。');
  } else if (failedTests > 0) {
    console.log('⚠️  部分测试失败，需要修复。');
  } else {
    console.log('⏭️  测试被跳过，请检查前置条件。');
  }
  
  return results;
}

runFullTest().then(results => {
  const allPassed = Object.values(results).every(r => r.status === 'PASSED' || r.status === 'SKIPPED');
  const anyFailed = Object.values(results).some(r => r.status === 'FAILED');
  
  if (anyFailed) {
    process.exit(1);
  } else if (allPassed) {
    process.exit(0);
  } else {
    process.exit(2);
  }
});