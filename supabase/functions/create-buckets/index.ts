// Supabase Edge Function: create-buckets
// 使用服务角色创建Storage Buckets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 创建Supabase客户端（使用服务角色密钥）
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 创建 spelling-images bucket
    const { data: bucket1, error: error1 } = await supabase.storage.createBucket('spelling-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    });

    if (error1 && !error1.message.includes('already exists')) {
      console.error('创建 spelling-images 失败:', error1);
    }

    // 创建 word-images bucket
    const { data: bucket2, error: error2 } = await supabase.storage.createBucket('word-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    });

    if (error2 && !error2.message.includes('already exists')) {
      console.error('创建 word-images 失败:', error2);
    }

    // 获取所有buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Buckets created successfully',
        buckets: buckets.map(b => ({ name: b.name, public: b.public })),
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
