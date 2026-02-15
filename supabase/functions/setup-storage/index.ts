// Supabase Edge Function: setup-storage
// 创建Storage Buckets和策略

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_URL = 'https://prfdoxcixwpvlbgqydfq.supabase.co';

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // 执行SQL创建buckets
    const sql = `
      -- 创建 spelling-images bucket
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('spelling-images', 'spelling-images', true)
      ON CONFLICT (id) DO NOTHING;

      -- 创建 word-images bucket
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('word-images', 'word-images', true)
      ON CONFLICT (id) DO NOTHING;

      -- 验证创建结果
      SELECT name, public FROM storage.buckets WHERE name IN ('spelling-images', 'word-images');
    `;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: sql }),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
