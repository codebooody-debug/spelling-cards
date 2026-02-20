// 测试 MiniMax TTS（绕过 Google）
const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

async function testMiniMaxTTS() {
  console.log('🧪 测试 MiniMax TTS（验证 Edge Function 本身）...\n');
  
  try {
    // 测试中文
    const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        text: 'Hello, this is a test',
        voice: 'male-qn-qingse',
        speed: 1.0
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ MiniMax TTS 测试成功！');
      console.log(`   引擎：${data.engine}`);
      console.log(`   音频长度：${data.audio?.length || 0} bytes`);
      console.log('\n🎉 Edge Function 正常工作，MiniMax 可用！');
      console.log('\n⚠️  Google Cloud TTS 失败的原因可能是：');
      console.log('   1. Cloud Text-to-Speech API 未启用');
      console.log('   2. API Key 有使用限制（IP/HTTP来源）');
      console.log('   3. 配额已用完');
      console.log('\n📋 请检查：https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
    } else {
      console.log('❌ MiniMax 也失败了：', data);
    }
  } catch (error) {
    console.log('❌ 测试出错：', error.message);
  }
}

testMiniMaxTTS();
