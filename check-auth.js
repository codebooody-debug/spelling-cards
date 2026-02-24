// 检查 Supabase Auth 配置
// 在浏览器控制台运行此脚本

async function checkAuthConfig() {
  console.log('=== Supabase Auth 诊断 ===\n');
  
  // 1. 检查环境变量
  console.log('1. 环境变量检查:');
  console.log('   SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置');
  console.log('   SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置');
  
  // 2. 检查当前会话
  console.log('\n2. 当前会话:');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.log('   ❌ 获取会话失败:', sessionError.message);
  } else if (session) {
    console.log('   ✅ 已登录用户:', session.user.email);
    console.log('   提供商:', session.user.app_metadata?.provider || '未知');
  } else {
    console.log('   ℹ️ 未登录');
  }
  
  // 3. 尝试获取 OAuth URL（不跳转）
  console.log('\n3. OAuth 配置测试:');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
    
    if (error) {
      console.log('   ❌ OAuth 配置错误:', error.message);
      if (error.message.includes('provider is not enabled')) {
        console.log('   💡 提示: Google 提供商未在 Supabase 中启用');
      }
    } else if (data?.url) {
      console.log('   ✅ OAuth URL 生成成功');
      console.log('   URL 预览:', data.url.substring(0, 80) + '...');
    }
  } catch (err) {
    console.log('   ❌ 测试失败:', err.message);
  }
  
  console.log('\n=== 诊断完成 ===');
}

// 运行诊断
checkAuthConfig();
