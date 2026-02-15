// 直接在浏览器控制台运行的诊断脚本
// 复制粘贴到浏览器控制台执行

async function diagnoseFlipCard() {
  console.log('🔍 FlipCard诊断开始...\n');
  
  // 1. 检查Supabase配置
  console.log('1️⃣ 检查Supabase配置');
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '未设置';
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置';
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseKey);
  
  // 2. 检查用户登录状态
  console.log('\n2️⃣ 检查用户登录状态');
  const { getSupabase } = await import('/src/lib/supabase.js');
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  console.log('   用户:', user ? user.id.substring(0, 8) + '...' : '未登录');
  
  // 3. 检查StudyPage的contentId
  console.log('\n3️⃣ 检查当前页面');
  const path = window.location.pathname;
  console.log('   路径:', path);
  const match = path.match(/\/study\/(.+)/);
  if (match) {
    console.log('   contentId:', match[1]);
  } else {
    console.log('   不在学习页面');
  }
  
  // 4. 检查FlipCard元素
  console.log('\n4️⃣ 检查FlipCard元素');
  const flipCards = document.querySelectorAll('.card-container');
  console.log('   FlipCard数量:', flipCards.length);
  
  // 5. 测试直接调用API
  console.log('\n5️⃣ 测试API调用');
  try {
    const { generateImage } = await import('/src/services/api.js');
    console.log('   generateImage函数:', typeof generateImage === 'function' ? '可用' : '不可用');
  } catch (e) {
    console.log('   导入失败:', e.message);
  }
  
  console.log('\n✅ 诊断完成');
}

diagnoseFlipCard();