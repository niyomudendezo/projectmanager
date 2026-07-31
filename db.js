const { createClient } = require('@supabase/supabase-js');

let client;

function readSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  return { url, key };
}

function getSupabase() {
  if (client) return client;

  const { url, key } = readSupabaseConfig();
  if (!url || !key) {
    throw new Error(
      'Supabase configuration is missing. Connect Supabase in Hostinger or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

async function checkDatabase() {
  const supabase = getSupabase();
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) throw error;
  return true;
}

module.exports = { getSupabase, checkDatabase, readSupabaseConfig };
