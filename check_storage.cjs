// 详细检查Storage文件
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AvO-QOMcXFmxW5EgBO5Scg_NVi30_Xn';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStorageFiles() {
  console.log('🔍 === 详细检查Storage文件 ===\n');
  
  // 1. 检查spelling-images中的文件夹
  console.log('1️⃣ 检查spelling-images...');
  const { data: spellingRoot, error: spellingRootError } = await supabase.storage
    .from('spelling-images')
    .list();
  
  if (spellingRootError) {
    console.error('   ❌ 错误:', spellingRootError.message);
  } else {
    console.log(`   根目录项目数: ${spellingRoot?.length || 0}`);
    
    for (const item of spellingRoot || []) {
      console.log(`   - ${item.name} (${item.id ? '文件夹' : '文件'})`);
      
      // 如果是文件夹，列出内容
      if (item.id) {
        const { data: subFiles } = await supabase.storage
          .from('spelling-images')
          .list(item.name);
        
        console.log(`     内容:`);
        for (const sub of subFiles || []) {
          console.log(`       - ${sub.name}`);
          
          // 生成URL
          const filePath = `${item.name}/${sub.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('spelling-images')
            .getPublicUrl(filePath);
          console.log(`         URL: ${publicUrl}`);
        }
      }
    }
  }
  
  // 2. 检查word-images
  console.log('\n2️⃣ 检查word-images...');
  const { data: wordRoot, error: wordRootError } = await supabase.storage
    .from('word-images')
    .list();
  
  if (wordRootError) {
    console.error('   ❌ 错误:', wordRootError.message);
  } else {
    console.log(`   根目录项目数: ${wordRoot?.length || 0}`);
    
    for (const item of wordRoot || []) {
      console.log(`   - ${item.name} (${item.id ? '文件夹' : '文件'})`);
      
      if (item.id) {
        const { data: userFolders } = await supabase.storage
          .from('word-images')
          .list(item.name);
        
        console.log(`     用户文件夹内容:`);
        for (const userFolder of userFolders || []) {
          console.log(`       - ${userFolder.name}`);
          
          if (userFolder.id) {
            const folderPath = `${item.name}/${userFolder.name}`;
            const { data: files } = await supabase.storage
              .from('word-images')
              .list(folderPath);
            
            for (const file of files || []) {
              console.log(`         - ${file.name}`);
              
              const filePath = `${folderPath}/${file.name}`;
              const { data: { publicUrl } } = supabase.storage
                .from('word-images')
                .getPublicUrl(filePath);
              console.log(`           URL: ${publicUrl}`);
            }
          }
        }
      }
    }
  }
  
  // 3. 测试直接访问一个已知文件
  console.log('\n3️⃣ 测试直接访问已知文件...');
  const testUrl = `${SUPABASE_URL}/storage/v1/object/public/spelling-images/744a0ec6-1643-4e44-92a0-7f214bcd2d1e/1771146548519.jpg`;
  console.log(`   测试URL: ${testUrl}`);
  console.log('   请在浏览器中打开此URL查看是否能显示图片');
  
  console.log('\n✅ 检查完成');
}

checkStorageFiles().catch(console.error);