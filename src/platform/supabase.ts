import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase clients...');

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token'
  }
});

// Create a single instance of the admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    storageKey: 'supabase.admin.token'
  }
});

// Log auth state changes for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  if (session?.user) {
    console.log('User email:', session.user.email);
    console.log('User ID:', session.user.id);
  }
});

export { supabase, supabaseAdmin };

export const TABLES = {
  USERS: 'users',
  THREADS: 'threads',
  WORKFLOWS: 'workflows'
} as const; 