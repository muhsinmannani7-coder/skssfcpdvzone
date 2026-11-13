-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE – MOBILE APP MANAGEMENT SYSTEM UPGRADE
-- Safe, non-destructive migration. Preserves all existing tables & data.
-- ============================================================

-- 1. Alter branch_profiles to include all comprehensive branch & mahallu fields
ALTER TABLE public.branch_profiles 
  ADD COLUMN IF NOT EXISTS name_ml TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS working_sec_name TEXT,
  ADD COLUMN IF NOT EXISTS working_sec_mobile TEXT,
  ADD COLUMN IF NOT EXISTS mahallu_name TEXT,
  ADD COLUMN IF NOT EXISTS mahallu_president_name TEXT,
  ADD COLUMN IF NOT EXISTS mahallu_president_mobile TEXT,
  ADD COLUMN IF NOT EXISTS mahallu_secretary_name TEXT,
  ADD COLUMN IF NOT EXISTS mahallu_secretary_mobile TEXT,
  ADD COLUMN IF NOT EXISTS masjid_details TEXT,
  ADD COLUMN IF NOT EXISTS other_office_bearers TEXT,
  ADD COLUMN IF NOT EXISTS committee_members_list JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_members INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_workers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meeting_details TEXT,
  ADD COLUMN IF NOT EXISTS organizational_activities TEXT,
  ADD COLUMN IF NOT EXISTS educational_activities TEXT,
  ADD COLUMN IF NOT EXISTS social_service_activities TEXT,
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'draft' CHECK (profile_status IN ('draft', 'submitted', 'approved')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. SECRETARY ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.secretary_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRANCH ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.branch_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'organizational' CHECK (category IN ('organizational', 'educational', 'social', 'meeting')),
  activity_date DATE NOT NULL,
  description TEXT NOT NULL,
  participants_count INTEGER DEFAULT 0,
  photos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'approved', 'published')),
  created_by_secretary_id UUID REFERENCES public.secretary_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'admin', 'secretary')),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.secretary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated access policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active activities') THEN
    CREATE POLICY "Public read active activities" ON public.branch_activities FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Full access on branch activities') THEN
    CREATE POLICY "Full access on branch activities" ON public.branch_activities FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Full access on secretary accounts') THEN
    CREATE POLICY "Full access on secretary accounts" ON public.secretary_accounts FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Full access on notifications') THEN
    CREATE POLICY "Full access on notifications" ON public.app_notifications FOR ALL USING (true);
  END IF;
END $$;
