// Supabase Edge Function: init-buckets
// 直接执行 SQL 创建 Storage Buckets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 获取服务角色密钥（从环境变量）
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Service role key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 创建 buckets 的 SQL
    const sql = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
      VALUES 
        ('spelling-images', 'spelling-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW()),
        ('word-images', 'word-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types,
        updated_at = NOW()
      RETURNING id, name, public;
    `;

    // 执行 SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ query: sql }),
    });

    const result = await response.text();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Buckets created',
        result: result,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
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
