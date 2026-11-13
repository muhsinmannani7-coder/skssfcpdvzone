-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE – PLATFORM UPGRADE MIGRATION
-- Non-destructive extension: Preserves all existing tables & attendance
-- Safe to run in Supabase SQL Editor
-- ============================================================

-- 1. VIDEOS TABLE (YouTube integration + metadata)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. VIDEO LIKES (In-app engagement)
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id, user_identifier)
);

-- 3. VIDEO COMMENTS (In-app moderated comments)
CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BRANCH PERFORMANCE SCOREBOARD (100-mark evaluation system)
-- Categories: MASIRA (10), KHUTBIYYATH (12), HIDAYA (15), EDU VISION (12),
-- RAHMA BLOOD BANK (12), SAHACHARI CONNECT (22), ULAMA-UMARA SANGAMAM (17)
CREATE TABLE IF NOT EXISTS public.branch_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'MASIRA', 'KHUTBIYYATH', 'HIDAYA', 'EDU VISION',
    'RAHMA BLOOD BANK', 'SAHACHARI CONNECT', 'ULAMA-UMARA SANGAMAM'
  )),
  marks NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(5,2) NOT NULL,
  notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  evaluated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(unit_id, category)
);

-- 5. BRANCH PROFILES & DIRECTORY (16 branches contacts)
CREATE TABLE IF NOT EXISTS public.branch_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE UNIQUE,
  president_name TEXT,
  president_mobile TEXT,
  secretary_name TEXT,
  secretary_mobile TEXT,
  treasurer_name TEXT,
  treasurer_mobile TEXT,
  address TEXT,
  photo_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EVENTS & PROJECTS (MASIRA 2026, Seminars, Meetings)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  program_type TEXT NOT NULL DEFAULT 'Program',
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ANNOUNCEMENTS (News, Circulars & Alerts)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ULAMA DIRECTORY
CREATE TABLE IF NOT EXISTS public.ulama_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT,
  mahallu TEXT,
  mobile TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DOCTORS DIRECTORY
CREATE TABLE IF NOT EXISTS public.doctors_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT,
  hospital TEXT,
  mobile TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ulama_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors_directory ENABLE ROW LEVEL SECURITY;

-- Anonymous public read policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published videos') THEN
    CREATE POLICY "Public can view published videos" ON public.videos FOR SELECT USING (is_published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view video likes') THEN
    CREATE POLICY "Public can view video likes" ON public.video_likes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can like videos') THEN
    CREATE POLICY "Public can like videos" ON public.video_likes FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view approved comments') THEN
    CREATE POLICY "Public can view approved comments" ON public.video_comments FOR SELECT USING (is_approved = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can post comments') THEN
    CREATE POLICY "Public can post comments" ON public.video_comments FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published branch scores') THEN
    CREATE POLICY "Public can view published branch scores" ON public.branch_scores FOR SELECT USING (is_published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view branch profiles') THEN
    CREATE POLICY "Public can view branch profiles" ON public.branch_profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view events') THEN
    CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published announcements') THEN
    CREATE POLICY "Public can view published announcements" ON public.announcements FOR SELECT USING (is_published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active ulama') THEN
    CREATE POLICY "Public can view active ulama" ON public.ulama_directory FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active doctors') THEN
    CREATE POLICY "Public can view active doctors" ON public.doctors_directory FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Admin full management policies (using service role or admin profile check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on videos') THEN
    CREATE POLICY "Admins have full access on videos" ON public.videos FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on comments') THEN
    CREATE POLICY "Admins have full access on comments" ON public.video_comments FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on branch scores') THEN
    CREATE POLICY "Admins have full access on branch scores" ON public.branch_scores FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on branch profiles') THEN
    CREATE POLICY "Admins have full access on branch profiles" ON public.branch_profiles FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on events') THEN
    CREATE POLICY "Admins have full access on events" ON public.events FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on announcements') THEN
    CREATE POLICY "Admins have full access on announcements" ON public.announcements FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on ulama') THEN
    CREATE POLICY "Admins have full access on ulama" ON public.ulama_directory FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access on doctors') THEN
    CREATE POLICY "Admins have full access on doctors" ON public.doctors_directory FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Increment view count function
CREATE OR REPLACE FUNCTION public.increment_video_views(p_video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET view_count = view_count + 1
  WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
