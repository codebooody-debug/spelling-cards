// Supabase Edge Function: test-upload
// 测试登录后的图片上传功能

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, serviceRoleKey);

    // 1. 生成测试图片
    console.log('1. 生成测试图片...');
    const { data: imageData, error: genError } = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt: 'A simple red apple on white background, children book illustration style',
        width: 512,
        height: 512
      }
    });

    if (genError) {
      throw new Error(`图片生成失败: ${genError.message}`);
    }

    // 2. 上传到 Storage
    console.log('2. 上传图片到 Storage...');
    
    // 创建一个测试用户 ID 和学习记录 ID
    const testUserId = 'test-user-' + Date.now();
    const testRecordId = 'test-record-' + Date.now();
    const fileName = `${testUserId}/${testRecordId}/apple.png`;
    
    // 解码 base64 图片
    const base64Data = imageData.imageBase64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 上传
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('word-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`上传失败: ${uploadError.message}`);
    }

    // 3. 获取 public URL
    const { data: { publicUrl } } = supabase.storage
      .from('word-images')
      .getPublicUrl(fileName);

    // 4. 验证文件存在
    const { data: files, error: listError } = await supabase.storage
      .from('word-images')
      .list(`${testUserId}/${testRecordId}`);

    if (listError) {
      throw new Error(`验证失败: ${listError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '测试完成',
        results: {
          imageGenerated: true,
          imageSize: bytes.length,
          uploaded: !uploadError,
          publicUrl: publicUrl,
          fileVerified: files && files.length > 0,
          files: files?.map(f => f.name)
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
