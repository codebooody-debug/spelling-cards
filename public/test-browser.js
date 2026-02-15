// 浏览器端完整测试脚本
// 在浏览器控制台运行此代码

async function testFullWorkflow() {
  console.log('🧪 === 浏览器端完整测试 ===\n');
  
  const results = {
    supabaseConfig: false,
    userAuth: false,
    createRecord: false,
    uploadImage: false,
    saveWordMedia: false
  };
  
  try {
    // 1. 检查Supabase配置
    console.log('1️⃣ 检查Supabase配置...');
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      results.supabaseConfig = true;
      console.log('   ✅ Supabase已配置');
      console.log('   URL:', supabaseUrl);
    } else {
      console.log('   ❌ Supabase未配置');
      return results;
    }
    
    // 2. 检查用户认证
    console.log('\n2️⃣ 检查用户认证...');
    const supabase = window.supabaseClient || (await import('../src/lib/supabase.js')).getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      results.userAuth = true;
      console.log('   ✅ 用户已登录:', user.id.substring(0, 8) + '...');
    } else {
      console.log('   ❌ 用户未登录');
      return results;
    }
    
    // 3. 测试创建学习记录
    console.log('\n3️⃣ 测试创建学习记录...');
    const { createStudyRecord } = (await import('../src/context/AppContext.jsx')).useApp();
    
    const testRecord = {
      grade: 'P3',
      term: 'Term 1',
      subject: 'Spelling',
      title: 'Browser Test - ' + new Date().toLocaleString(),
      spellingNumber: 'Test-001',
      sourceImage: null, // 简化测试，不上传图片
      content: {
        title: 'Test',
        total_items: 1,
        items: [{
          word: 'test',
          meaning: '测试',
          sentence: 'This is a test.'
        }]
      }
    };
    
    try {
      const newRecord = await createStudyRecord(testRecord);
      if (newRecord && newRecord.id) {
        results.createRecord = true;
        console.log('   ✅ 学习记录创建成功:', newRecord.id.substring(0, 8) + '...');
        
        // 4. 测试上传图片
        console.log('\n4️⃣ 测试上传图片...');
        const { uploadWordImage } = await import('../src/services/storage.js');
        
        // 创建一个简单的测试图片
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        const testImageBase64 = canvas.toDataURL('image/png');
        
        const imageUrl = await uploadWordImage('test', testImageBase64, newRecord.id);
        
        if (imageUrl) {
          results.uploadImage = true;
          console.log('   ✅ 图片上传成功');
          console.log('   URL:', imageUrl);
          
          // 5. 测试保存word_media
          console.log('\n5️⃣ 测试保存word_media...');
          const { saveWordMedia } = await import('../src/services/storage.js');
          
          const mediaData = {
            word: 'test',
            studyRecordId: newRecord.id,
            imageUrl: imageUrl,
            meaning: '测试',
            wordType: 'noun',
            phonetic: '/test/',
            synonyms: [],
            antonyms: [],
            practiceSentences: [],
            memoryTip: 'TEST',
            sentence: 'This is a test.'
          };
          
          const savedMedia = await saveWordMedia(mediaData);
          
          if (savedMedia) {
            results.saveWordMedia = true;
            console.log('   ✅ word_media保存成功');
          } else {
            console.log('   ❌ word_media保存失败');
          }
        } else {
          console.log('   ❌ 图片上传失败');
        }
        
        // 清理测试数据
        console.log('\n6️⃣ 清理测试数据...');
        await supabase.from('word_media').delete().eq('study_record_id', newRecord.id);
        await supabase.from('study_records').delete().eq('id', newRecord.id);
        console.log('   ✅ 测试数据已清理');
        
      } else {
        console.log('   ❌ 学习记录创建失败');
      }
    } catch (error) {
      console.log('   ❌ 错误:', error.message);
      console.error(error);
    }
    
  } catch (error) {
    console.error('测试异常:', error);
  }
  
  // 输出结果
  console.log('\n📊 === 测试结果 ===');
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  const allPassed = Object.values(results).every(v => v);
  console.log('\n' + (allPassed ? '🎉 所有测试通过！' : '⚠️ 部分测试失败'));
  
  return results;
}

// 运行测试
testFullWorkflow();