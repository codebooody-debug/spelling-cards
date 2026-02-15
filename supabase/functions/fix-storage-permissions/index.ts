// Supabase Edge Function: fix-storage-permissions
// 修复 Storage 权限配置

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

    // 执行 SQL 修复权限
    const sql = `
      -- 确保 buckets 存在
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
      VALUES 
        ('spelling-images', 'spelling-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW()),
        ('word-images', 'word-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW()),
        ('word-audios', 'word-audios', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types,
        updated_at = NOW();

      -- 创建公开访问策略
      CREATE POLICY IF NOT EXISTS "Allow public read spelling-images"
      ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id = 'spelling-images');

      CREATE POLICY IF NOT EXISTS "Allow public read word-images"
      ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id = 'word-images');

      CREATE POLICY IF NOT EXISTS "Allow public read word-audios"
      ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id = 'word-audios');

      -- 验证
      SELECT id, name, public FROM storage.buckets 
      WHERE id IN ('spelling-images', 'word-images', 'word-audios');
    `;

    // 使用 RPC 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage permissions fixed',
        data: data,
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
