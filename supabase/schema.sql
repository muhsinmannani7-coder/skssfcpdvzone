-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE – ATTENDANCE MANAGEMENT SYSTEM
-- Complete PostgreSQL Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (linked to Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CLUSTERS (3 clusters)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.clusters (name, code) VALUES
  ('PADAPPENGAD CLUSTER', 'PAD'),
  ('KUTTAPARAMB CLUSTER', 'KUT'),
  ('PERUMALABAD CLUSTER', 'PER')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. UNITS (16 units across 3 clusters)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cluster_id UUID NOT NULL REFERENCES public.clusters(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, cluster_id)
);

-- ============================================================
-- 4. COMMITTEES (Zone, Cluster, Unit level)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('zone', 'cluster', 'unit')),
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE RESTRICT,
  unit_id UUID REFERENCES public.units(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. POSITIONS (roles within committees)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. MEMBERS (unique individuals)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  membership_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_mobile ON public.members(mobile);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(full_name);

-- ============================================================
-- 7. MEMBER_POSITIONS (many-to-many: members to positions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.member_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.clusters(id),
  unit_id UUID REFERENCES public.units(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_member_positions_member ON public.member_positions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_positions_position ON public.member_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_member_positions_committee ON public.member_positions(committee_id);

-- ============================================================
-- 8. SUB-WINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sub_wings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  chairperson_name TEXT NOT NULL,
  mobile TEXT,
  membership_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. ATTENDANCE OPERATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operators_mobile ON public.attendance_operators(mobile);

-- ============================================================
-- 10. PROGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  program_date DATE NOT NULL,
  start_time TIME,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed')),
  started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  started_by UUID REFERENCES public.profiles(id),
  closed_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_date ON public.programs(program_date);

-- ============================================================
-- 11. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  marked_by UUID REFERENCES public.profiles(id),
  operator_id UUID REFERENCES public.attendance_operators(id),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(program_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_program ON public.attendance(program_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_operator ON public.attendance(operator_id);

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_clusters_updated_at BEFORE UPDATE ON public.clusters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_member_positions_updated_at BEFORE UPDATE ON public.member_positions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_sub_wings_updated_at BEFORE UPDATE ON public.sub_wings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_operators_updated_at BEFORE UPDATE ON public.attendance_operators FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER handle_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role check functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- SECURE FUNCTION: Mark attendance
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_attendance(
  p_program_id UUID,
  p_member_id UUID,
  p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_program_status TEXT;
  v_existing UUID;
  v_attendance_id UUID;
BEGIN
  SELECT status INTO v_program_status
  FROM public.programs WHERE id = p_program_id;

  IF v_program_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  IF v_program_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program is not active');
  END IF;

  SELECT id INTO v_existing
  FROM public.attendance
  WHERE program_id = p_program_id AND member_id = p_member_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ATTENDANCE ALREADY MARKED', 'duplicate', true, 'attendance_id', v_existing);
  END IF;

  INSERT INTO public.attendance (program_id, member_id, marked_by, operator_id)
  VALUES (p_program_id, p_member_id, auth.uid(), p_operator_id)
  RETURNING id INTO v_attendance_id;

  INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, new_data)
  VALUES (auth.uid(), 'MARK_ATTENDANCE', 'attendance', v_attendance_id,
    jsonb_build_object('program_id', p_program_id, 'member_id', p_member_id));

  RETURN jsonb_build_object('success', true, 'attendance_id', v_attendance_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECURE FUNCTION: Start program (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.programs
  SET status = 'active', started_at = NOW(), started_by = auth.uid()
  WHERE id = p_program_id AND status = 'upcoming';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found or already started');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, table_name, record_id)
  VALUES (auth.uid(), 'START_PROGRAM', 'programs', p_program_id);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECURE FUNCTION: Close program (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.close_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.programs
  SET status = 'closed', closed_at = NOW(), closed_by = auth.uid()
  WHERE id = p_program_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found or not active');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, table_name, record_id)
  VALUES (auth.uid(), 'CLOSE_PROGRAM', 'programs', p_program_id);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_wings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Own profile" ON public.profiles;
CREATE POLICY "Own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "User update own" ON public.profiles;
CREATE POLICY "User update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLUSTERS (read: authenticated; write: admin)
DROP POLICY IF EXISTS "Auth view clusters" ON public.clusters;
CREATE POLICY "Auth view clusters" ON public.clusters FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage clusters" ON public.clusters;
CREATE POLICY "Admin manage clusters" ON public.clusters FOR ALL USING (public.is_admin());

-- UNITS
DROP POLICY IF EXISTS "Auth view units" ON public.units;
CREATE POLICY "Auth view units" ON public.units FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage units" ON public.units;
CREATE POLICY "Admin manage units" ON public.units FOR ALL USING (public.is_admin());

-- COMMITTEES
DROP POLICY IF EXISTS "Auth view committees" ON public.committees;
CREATE POLICY "Auth view committees" ON public.committees FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage committees" ON public.committees;
CREATE POLICY "Admin manage committees" ON public.committees FOR ALL USING (public.is_admin());

-- POSITIONS
DROP POLICY IF EXISTS "Auth view positions" ON public.positions;
CREATE POLICY "Auth view positions" ON public.positions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage positions" ON public.positions;
CREATE POLICY "Admin manage positions" ON public.positions FOR ALL USING (public.is_admin());

-- MEMBERS
DROP POLICY IF EXISTS "Auth view active members" ON public.members;
CREATE POLICY "Auth view active members" ON public.members FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage members" ON public.members;
CREATE POLICY "Admin manage members" ON public.members FOR ALL USING (public.is_admin());

-- MEMBER_POSITIONS
DROP POLICY IF EXISTS "Auth view member positions" ON public.member_positions;
CREATE POLICY "Auth view member positions" ON public.member_positions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage member positions" ON public.member_positions;
CREATE POLICY "Admin manage member positions" ON public.member_positions FOR ALL USING (public.is_admin());

-- SUB_WINGS
DROP POLICY IF EXISTS "Auth view sub wings" ON public.sub_wings;
CREATE POLICY "Auth view sub wings" ON public.sub_wings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage sub wings" ON public.sub_wings;
CREATE POLICY "Admin manage sub wings" ON public.sub_wings FOR ALL USING (public.is_admin());

-- ATTENDANCE_OPERATORS
DROP POLICY IF EXISTS "Operators view own record" ON public.attendance_operators;
CREATE POLICY "Operators view own record" ON public.attendance_operators FOR SELECT USING (auth.role() = 'authenticated' AND (public.is_admin() OR profile_id = auth.uid()));

DROP POLICY IF EXISTS "Admin manage operators" ON public.attendance_operators;
CREATE POLICY "Admin manage operators" ON public.attendance_operators FOR ALL USING (public.is_admin());

-- PROGRAMS
DROP POLICY IF EXISTS "Auth view programs" ON public.programs;
CREATE POLICY "Auth view programs" ON public.programs FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage programs" ON public.programs;
CREATE POLICY "Admin manage programs" ON public.programs FOR ALL USING (public.is_admin());

-- ATTENDANCE
DROP POLICY IF EXISTS "Auth view attendance" ON public.attendance;
CREATE POLICY "Auth view attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth insert attendance for active program" ON public.attendance;
CREATE POLICY "Auth insert attendance for active program" ON public.attendance FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.programs WHERE id = program_id AND status = 'active')
);

DROP POLICY IF EXISTS "Admin manage attendance" ON public.attendance;
CREATE POLICY "Admin manage attendance" ON public.attendance FOR ALL USING (public.is_admin());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admin view audit" ON public.audit_logs;
CREATE POLICY "Admin view audit" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Auth insert audit" ON public.audit_logs;
CREATE POLICY "Auth insert audit" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
