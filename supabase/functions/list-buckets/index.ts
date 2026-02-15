// Supabase Edge Function: list-buckets
// 使用 Service Role Key 查询 Storage Buckets

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

    // 查询所有 buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        buckets: buckets?.map(b => ({
          id: b.id,
          name: b.name,
          public: b.public,
          file_size_limit: b.file_size_limit,
          allowed_mime_types: b.allowed_mime_types,
        })) || [],
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
