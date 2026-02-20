// 测试 TTS Edge Function 配置
const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

async function testTTS() {
  console.log('🧪 测试 Google Cloud TTS 配置...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the text to speech system.',
        voice: 'en-US-Neural2-D',
        speed: 1.0
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ TTS 测试成功！');
      console.log(`   引擎：${data.engine}`);
      console.log(`   音频长度：${data.audio?.length || 0} bytes`);
      console.log('\n🎉 Google Cloud TTS 配置正确，可以正常使用！');
    } else {
      console.log('❌ TTS 测试失败：');
      console.log(`   状态码：${response.status}`);
      console.log(`   完整响应：`, JSON.stringify(data, null, 2));
      
      if (data.error?.includes('API key not valid') || data.error?.includes('API_KEY')) {
        console.log('\n⚠️  可能是 Google Cloud TTS API Key 未启用或无效');
        console.log('   请检查：https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
      }
    }
  } catch (error) {
    console.log('❌ 测试出错：', error.message);
  }
}

testTTS();
