-- Supabase Schema for Long Distance Relationship (LDR) MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure username column exists if table already existed previously
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. COUPLES TABLE
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_one UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_two UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LOVE LETTERS TABLE
CREATE TABLE IF NOT EXISTS public.love_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  unlock_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MOODS TABLE
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BUCKET LIST TABLE
CREATE TABLE IF NOT EXISTS public.bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'travel',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. COUNTDOWNS TABLE
CREATE TABLE IF NOT EXISTS public.countdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT DEFAULT 'visit',
  icon TEXT DEFAULT 'Heart',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;

-- Drop Existing Policies (prevents 42710 already exists errors on re-run)
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert/update to users" ON public.users;

DROP POLICY IF EXISTS "Allow public read access to couples" ON public.couples;
DROP POLICY IF EXISTS "Allow public insert/update to couples" ON public.couples;

DROP POLICY IF EXISTS "Allow public read access to memories" ON public.memories;
DROP POLICY IF EXISTS "Allow public insert to memories" ON public.memories;

DROP POLICY IF EXISTS "Allow public read access to love_letters" ON public.love_letters;
DROP POLICY IF EXISTS "Allow public insert to love_letters" ON public.love_letters;

DROP POLICY IF EXISTS "Allow public read access to moods" ON public.moods;
DROP POLICY IF EXISTS "Allow public insert to moods" ON public.moods;

DROP POLICY IF EXISTS "Allow public read access to bucket_list" ON public.bucket_list;
DROP POLICY IF EXISTS "Allow public insert/update to bucket_list" ON public.bucket_list;

DROP POLICY IF EXISTS "Allow public read access to countdowns" ON public.countdowns;
DROP POLICY IF EXISTS "Allow public insert to countdowns" ON public.countdowns;

-- Create Idempotent RLS Policies
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to users" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow public read access to couples" ON public.couples FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to couples" ON public.couples FOR ALL USING (true);

CREATE POLICY "Allow public read access to memories" ON public.memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert to memories" ON public.memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to love_letters" ON public.love_letters FOR SELECT USING (true);
CREATE POLICY "Allow public insert to love_letters" ON public.love_letters FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to moods" ON public.moods FOR SELECT USING (true);
CREATE POLICY "Allow public insert to moods" ON public.moods FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to bucket_list" ON public.bucket_list FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to bucket_list" ON public.bucket_list FOR ALL USING (true);

CREATE POLICY "Allow public read access to countdowns" ON public.countdowns FOR SELECT USING (true);
CREATE POLICY "Allow public insert to countdowns" ON public.countdowns FOR INSERT WITH CHECK (true);
