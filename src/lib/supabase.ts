import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to check connection
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    return !error;
  } catch (e) {
    console.error('Supabase connection error:', e);
    return false;
  }
}

// Types for Supabase tables
export type NewsRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string | null;
  summary: string | null;
  content: string | null;
  created_at: string;
};

export type ArticleRow = {
  id: string;
  nama: string;
  asal_sekolah: string;
  tanggal_penulisan: string;
  judul: string;
  isi: string;
  created_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  speaker: string | null;
  quota: number;
  registered_count: number;
  status: string;
  banner: string | null;
  category: string | null;
  created_at: string;
};

export type UserRow = {
  id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  status: string;
  komisariat: string;
  sekolah: string;
  whatsapp: string | null;
  username: string | null;
  password: string | null;
  status_pembayaran: string;
  iuran_bulanan: string;
  iuran_status: string;
  created_at: string;
};

export type ResourceRow = {
  id: string;
  title: string;
  category: string;
  grade: string;
  type: string;
  file_size: string | null;
  downloads: number;
  author: string | null;
  created_date: string | null;
  is_custom: boolean;
  file_url: string | null;
  created_at: string;
};

export type AIInteractionRow = {
  id: string;
  prompt: string | null;
  response: string | null;
  prompt_tokens: number;
  response_tokens: number;
  total_tokens: number;
  user_email: string | null;
  timestamp: string;
  date_string: string | null;
};

export type SettingsRow = {
  id: string;
  data: Record<string, any>;
  updated_at: string;
};
