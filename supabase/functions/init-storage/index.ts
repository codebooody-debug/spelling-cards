// Supabase Edge Function: init-storage
// 初始化存储，使用 SQL 直接创建 buckets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 从请求头中获取服务角色密钥
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = authHeader.replace('Bearer ', '');

    // 使用 SQL 创建 buckets
    const sql = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
      VALUES 
        ('spelling-images', 'spelling-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW()),
        ('word-images', 'word-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types,
        updated_at = NOW();
    `;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    // 查询创建的 buckets
    const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/storage/buckets`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    const buckets = await listResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Buckets initialized',
        buckets: buckets.map(b => ({ id: b.id, name: b.name, public: b.public })),
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
