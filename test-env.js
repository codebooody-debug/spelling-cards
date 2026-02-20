// 直接测试 Edge Function 环境变量
const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

async function testEdgeFunctionEnv() {
  console.log('🧪 测试 Edge Function 环境变量...\n');
  
  try {
    // 测试一个简单的请求，看是否能获取环境变量信息
    const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'test',
        voice: 'en-US-Neural2-D',
        speed: 1.0
      })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.log('❌ 测试出错：', error.message);
  }
}

testEdgeFunctionEnv();
