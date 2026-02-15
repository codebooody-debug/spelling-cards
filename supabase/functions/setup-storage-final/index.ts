// Supabase Edge Function: setup-storage-final
// 使用 Supabase Admin API 创建 Storage Buckets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 从环境变量获取服务角色密钥
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 创建 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, serviceRoleKey);

    // 创建 spelling-images bucket
    const { data: bucket1, error: error1 } = await supabase.storage.createBucket('spelling-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760,
    });

    // 创建 word-images bucket
    const { data: bucket2, error: error2 } = await supabase.storage.createBucket('word-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760,
    });

    // 获取所有 buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage buckets setup complete',
        buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) || [],
        errors: {
          spellingImages: error1?.message || null,
          wordImages: error2?.message || null,
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
