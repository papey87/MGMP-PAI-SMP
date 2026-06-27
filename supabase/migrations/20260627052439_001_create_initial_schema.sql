-- News/Berita table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'AGENDA',
  date TEXT NOT NULL,
  image TEXT,
  summary TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  asal_sekolah TEXT NOT NULL,
  tanggal_penulisan TEXT NOT NULL,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  speaker TEXT,
  quota INTEGER DEFAULT 0,
  registered_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Mendatang',
  banner TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Teachers) table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT,
  nuptk TEXT,
  status TEXT NOT NULL DEFAULT 'Non ASN',
  komisariat TEXT NOT NULL DEFAULT 'subang',
  sekolah TEXT NOT NULL,
  whatsapp TEXT,
  username TEXT UNIQUE,
  password TEXT,
  status_pembayaran TEXT DEFAULT 'Belum Bayar',
  iuran_bulanan TEXT DEFAULT 'Belum Bayar',
  iuran_status TEXT DEFAULT 'Belum Bayar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (key-value pairs for layout, profile, announcement)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources (Perangkat Ajar) table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  grade TEXT NOT NULL,
  type TEXT NOT NULL,
  file_size TEXT,
  downloads INTEGER DEFAULT 0,
  author TEXT,
  created_date TEXT,
  is_custom BOOLEAN DEFAULT false,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Interactions log table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT,
  response TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  user_email TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_string TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_users_komisariat ON users(komisariat);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Enable Row Level Security
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write (for this app where anyone can access)
CREATE POLICY "Allow public read access on news" ON news FOR SELECT USING (true);
CREATE POLICY "Allow public write access on news" ON news FOR ALL USING (true);

CREATE POLICY "Allow public read access on articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Allow public write access on articles" ON articles FOR ALL USING (true);

CREATE POLICY "Allow public read access on events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public write access on events" ON events FOR ALL USING (true);

CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public write access on users" ON users FOR ALL USING (true);

CREATE POLICY "Allow public read access on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public write access on settings" ON settings FOR ALL USING (true);

CREATE POLICY "Allow public read access on resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Allow public write access on resources" ON resources FOR ALL USING (true);

CREATE POLICY "Allow public read access on ai_interactions" ON ai_interactions FOR SELECT USING (true);
CREATE POLICY "Allow public write access on ai_interactions" ON ai_interactions FOR ALL USING (true);

-- Insert default settings
INSERT INTO settings (id, data) VALUES 
  ('layout', '{"tabs": [{"id": "beranda", "label": "Beranda", "visible": true}, {"id": "profil", "label": "Profil MGMP", "visible": true}, {"id": "informasi", "label": "Informasi", "visible": true}, {"id": "kegiatan", "label": "Agenda Kegiatan", "visible": true}, {"id": "perangkat", "label": "Perangkat Ajar", "visible": true}, {"id": "artikel", "label": "Artikel", "visible": true}, {"id": "ai-sobat", "label": "Tanya AI Sobat Guru", "visible": true}], "homeSections": [{"id": "hero", "label": "Hero Banner", "visible": true, "order": 1}, {"id": "siladik", "label": "Sistem Informasi SILADIK", "visible": true, "order": 2}, {"id": "advice", "label": "Kolom Berbagi Nasihat", "visible": true, "order": 3}, {"id": "news_quote", "label": "Berita & Ruang Inspirasi", "visible": true, "order": 4}], "customSections": []}'::jsonb),
  ('profile', '{"visi": "", "misi": [], "tujuan": [], "structure": []}'::jsonb),
  ('announcement', '{"text": "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang!", "badgeText": "INFO PENTING", "actionType": "apk", "blinking": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;