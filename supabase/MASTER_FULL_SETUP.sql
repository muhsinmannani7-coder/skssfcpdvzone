-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE – COMPLETE MASTER SQL
-- Run this SINGLE FILE in Supabase SQL Editor
-- Includes: Schema + All Seed Data
-- ============================================================-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE â€“ ATTENDANCE MANAGEMENT SYSTEM
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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


-- ============================================================
-- SEED: ZONE COMMITTEE
-- ============================================================
-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE COMMITTEE â€“ SEED DATA
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Step 1: Insert Zone Committee record
INSERT INTO public.committees (id, name, level)
VALUES ('00000000-0000-0000-0000-000000000001', 'CHAPPARAPPADAVU SKSSF ZONE COMMITTEE', 'zone')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert 28 Positions in Zone Committee
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  -- à´­à´¾à´°à´µà´¾à´¹à´¿à´•àµ¾ (Office Bearers)
  ('10000000-0000-0000-0000-000000000001', 'PRESIDENT',          '00000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000002', 'GENERAL SECRETARY',  '00000000-0000-0000-0000-000000000001', 2),
  ('10000000-0000-0000-0000-000000000003', 'TREASURER',          '00000000-0000-0000-0000-000000000001', 3),
  ('10000000-0000-0000-0000-000000000004', 'WORKING SECRETARY',  '00000000-0000-0000-0000-000000000001', 4),
  ('10000000-0000-0000-0000-000000000005', 'VICE PRESIDENT',     '00000000-0000-0000-0000-000000000001', 5),
  ('10000000-0000-0000-0000-000000000006', 'VICE PRESIDENT',     '00000000-0000-0000-0000-000000000001', 6),
  ('10000000-0000-0000-0000-000000000007', 'VICE PRESIDENT',     '00000000-0000-0000-0000-000000000001', 7),
  ('10000000-0000-0000-0000-000000000008', 'JOINT SECRETARY',    '00000000-0000-0000-0000-000000000001', 8),
  ('10000000-0000-0000-0000-000000000009', 'JOINT SECRETARY',    '00000000-0000-0000-0000-000000000001', 9),
  ('10000000-0000-0000-0000-000000000010', 'JOINT SECRETARY',    '00000000-0000-0000-0000-000000000001', 10),
  -- Secretariat Members
  ('10000000-0000-0000-0000-000000000011', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 11),
  ('10000000-0000-0000-0000-000000000012', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 12),
  ('10000000-0000-0000-0000-000000000013', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 13),
  ('10000000-0000-0000-0000-000000000014', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 14),
  ('10000000-0000-0000-0000-000000000015', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 15),
  ('10000000-0000-0000-0000-000000000016', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 16),
  ('10000000-0000-0000-0000-000000000017', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 17),
  ('10000000-0000-0000-0000-000000000018', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 18),
  ('10000000-0000-0000-0000-000000000019', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 19),
  ('10000000-0000-0000-0000-000000000020', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 20),
  ('10000000-0000-0000-0000-000000000021', 'SECRETARIAT MEMBER', '00000000-0000-0000-0000-000000000001', 21),
  -- Sub-Wing Chairmen
  ('10000000-0000-0000-0000-000000000022', 'IBAD CHAIRMAN',       '00000000-0000-0000-0000-000000000001', 22),
  ('10000000-0000-0000-0000-000000000023', 'MEDIA CHAIRMAN',      '00000000-0000-0000-0000-000000000001', 23),
  ('10000000-0000-0000-0000-000000000024', 'SARGALAYAM CHAIRMAN', '00000000-0000-0000-0000-000000000001', 24),
  ('10000000-0000-0000-0000-000000000025', 'TREND CHAIRMAN',      '00000000-0000-0000-0000-000000000001', 25),
  ('10000000-0000-0000-0000-000000000026', 'VIQAYA CHAIRMAN',     '00000000-0000-0000-0000-000000000001', 26),
  ('10000000-0000-0000-0000-000000000027', 'CAMPUS CHAIRMAN',     '00000000-0000-0000-0000-000000000001', 27),
  ('10000000-0000-0000-0000-000000000028', 'THALABA CHAIRMAN',    '00000000-0000-0000-0000-000000000001', 28)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert 28 Members (unique individuals)
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- à´­à´¾à´°à´µà´¾à´¹à´¿à´•àµ¾
  ('20000000-0000-0000-0000-000000000001', 'JAMSHEER DARIMI PERUVANA',       '9746969716', '2026/4877'),
  ('20000000-0000-0000-0000-000000000002', 'MUHSIN MANNANI',                  '7559950633', '2026/4879'),
  ('20000000-0000-0000-0000-000000000003', 'SINSARULHAQ AP',                  '9048386344', '2026/5179'),
  ('20000000-0000-0000-0000-000000000004', 'MUHAJIR K',                       '9744149743', '2026/4895'),
  ('20000000-0000-0000-0000-000000000005', 'RIYAS K',                         '9656221909', '2026/5093'),
  ('20000000-0000-0000-0000-000000000006', 'MUBASHEER K',                     '6235846789', '2026/4930'),
  ('20000000-0000-0000-0000-000000000007', 'UMMER PERUVANA',                  '9747130613', '2026/4919'),
  ('20000000-0000-0000-0000-000000000008', 'MUHAMMAD RIYAS HAITHAMI',         '9562440338', '2026/4911'),
  ('20000000-0000-0000-0000-000000000009', 'HAFIL MUHAMMED SHIBILI FAIZY',   '9747958523', '2026/4916'),
  ('20000000-0000-0000-0000-000000000010', 'SHAHID OP',                       '9847900075', '2026/5106'),
  -- Secretariat Members
  ('20000000-0000-0000-0000-000000000011', 'UNAIS ASNAVI',                    '7306721640', '2026/5013'),
  ('20000000-0000-0000-0000-000000000012', 'RIYAS P',                         '9961200153', '2026/4876'),
  ('20000000-0000-0000-0000-000000000013', 'ASHRAF K',                        '9846202327', '2026/5116'),
  ('20000000-0000-0000-0000-000000000014', 'AFSAL RAHMANI',                   '9947527941', '2026/4983'),
  ('20000000-0000-0000-0000-000000000015', 'DILSHAD N',                       '9061306033', '2026/5122'),
  ('20000000-0000-0000-0000-000000000016', 'ARSHAD P',                        '8590909112', '2026/5170'),
  ('20000000-0000-0000-0000-000000000017', 'MUHAMMED NAFIH KV',               '8547995318', '2026/4979'),
  ('20000000-0000-0000-0000-000000000018', 'HANEEFA P',                       '9562484778', '2026/4961'),
  ('20000000-0000-0000-0000-000000000019', 'NIZAMUDHEEN K P',                 '9061295670', '2026/5138'),
  ('20000000-0000-0000-0000-000000000020', 'MUHAMMED SHARAFU SHAMEEM K V',    '8606787709', '2026/5660'),
  ('20000000-0000-0000-0000-000000000021', 'IRSHAD M',                        '7510221259', '2026/4892'),
  -- Sub-Wing Chairmen
  ('20000000-0000-0000-0000-000000000022', 'ABDULLA ASADI NADWI',             '9747375433', '2026/4912'),
  ('20000000-0000-0000-0000-000000000023', 'SHAMMAS K',                       '8590650124', '2026/4880'),
  ('20000000-0000-0000-0000-000000000024', 'ASLAM C',                         '9605202229', '2026/5595'),
  ('20000000-0000-0000-0000-000000000025', 'MANSOOR ALI K P',                 '9947602652', '2026/4947'),
  ('20000000-0000-0000-0000-000000000026', 'MUTHALIB NOORANI',                '9847914412', '2026/4901'),
  ('20000000-0000-0000-0000-000000000027', 'NISAMUDDEEN P K',                 '9747581763', '2026/5044'),
  ('20000000-0000-0000-0000-000000000028', 'NABEEL IRFANIYYA',                '9072938597', NULL)
ON CONFLICT (mobile) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_number = COALESCE(EXCLUDED.membership_number, members.membership_number);

-- Step 4: Link each Member to their Zone Committee Position
INSERT INTO public.member_positions (member_id, position_id, committee_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'), -- JAMSHEER       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'), -- MUHSIN         â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'), -- SINSARULHAQ    â†’ TREASURER
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'), -- MUHAJIR        â†’ WORKING SECRETARY
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001'), -- RIYAS K        â†’ VICE PRESIDENT
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001'), -- MUBASHEER      â†’ VICE PRESIDENT
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001'), -- UMMER          â†’ VICE PRESIDENT
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001'), -- MUHAMMAD RIYAS â†’ JOINT SECRETARY
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001'), -- HAFIL MUHAMMED â†’ JOINT SECRETARY
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001'), -- SHAHID OP      â†’ JOINT SECRETARY
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001'), -- UNAIS          â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001'), -- RIYAS P        â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001'), -- ASHRAF K       â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001'), -- AFSAL RAHMANI  â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001'), -- DILSHAD N      â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001'), -- ARSHAD P       â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001'), -- MUHAMMED NAFIH â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001'), -- HANEEFA P      â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001'), -- NIZAMUDHEEN    â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001'), -- SHARAFU SHAMEEMâ†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001'), -- IRSHAD M       â†’ SECRETARIAT MEMBER
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001'), -- ABDULLA ASADI  â†’ IBAD CHAIRMAN
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001'), -- SHAMMAS K      â†’ MEDIA CHAIRMAN
  ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001'), -- ASLAM C        â†’ SARGALAYAM CHAIRMAN
  ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001'), -- MANSOOR ALI    â†’ TREND CHAIRMAN
  ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001'), -- MUTHALIB       â†’ VIQAYA CHAIRMAN
  ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001'), -- NISAMUDDEEN PK â†’ CAMPUS CHAIRMAN
  ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001')  -- NABEEL         â†’ THALABA CHAIRMAN
ON CONFLICT (member_id, position_id) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 
  (SELECT COUNT(*) FROM public.members WHERE id::text LIKE '20000000%') AS total_members,
  (SELECT COUNT(*) FROM public.positions WHERE committee_id = '00000000-0000-0000-0000-000000000001') AS total_positions,
  (SELECT COUNT(*) FROM public.member_positions WHERE committee_id = '00000000-0000-0000-0000-000000000001') AS total_mappings;

-- Full list
SELECT 
  p.sort_order AS no,
  p.title AS position,
  m.full_name,
  m.mobile,
  m.membership_number
FROM public.member_positions mp
JOIN public.members m ON m.id = mp.member_id
JOIN public.positions p ON p.id = mp.position_id
WHERE mp.committee_id = '00000000-0000-0000-0000-000000000001'
ORDER BY p.sort_order;


-- ============================================================
-- SEED: CLUSTER COMMITTEES
-- ============================================================
-- ============================================================
-- SKSSF CHAPPARAPPADAVU â€“ CLUSTER COMMITTEES SEED DATA
-- Padappengad (PAD), Kuttaparamb (KUT), Perumalabad (PER)
-- Run this AFTER seed_zone_committee.sql
-- ============================================================

-- ============================================================
-- Step 1: Create 3 Cluster Committee records
-- ============================================================
INSERT INTO public.committees (id, name, level, cluster_id)
SELECT '00000000-0000-0000-0000-000000000002', 'PADAPPENGAD CLUSTER COMMITTEE', 'cluster', id
FROM public.clusters WHERE code = 'PAD'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.committees (id, name, level, cluster_id)
SELECT '00000000-0000-0000-0000-000000000003', 'KUTTAPARAMB CLUSTER COMMITTEE', 'cluster', id
FROM public.clusters WHERE code = 'KUT'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.committees (id, name, level, cluster_id)
SELECT '00000000-0000-0000-0000-000000000004', 'PERUMALABAD CLUSTER COMMITTEE', 'cluster', id
FROM public.clusters WHERE code = 'PER'
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Create 12 Positions (4 per cluster)
-- ============================================================
-- PADAPPENGAD CLUSTER POSITIONS
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000002', 1),
  ('30000000-0000-0000-0000-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000002', 2),
  ('30000000-0000-0000-0000-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000002', 3),
  ('30000000-0000-0000-0000-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000002', 4)
ON CONFLICT (id) DO NOTHING;

-- KUTTAPARAMB CLUSTER POSITIONS
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000005', 'PRESIDENT',         '00000000-0000-0000-0000-000000000003', 1),
  ('30000000-0000-0000-0000-000000000006', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000003', 2),
  ('30000000-0000-0000-0000-000000000007', 'TREASURER',         '00000000-0000-0000-0000-000000000003', 3),
  ('30000000-0000-0000-0000-000000000008', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000003', 4)
ON CONFLICT (id) DO NOTHING;

-- PERUMALABAD CLUSTER POSITIONS
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000009',  'PRESIDENT',         '00000000-0000-0000-0000-000000000004', 1),
  ('30000000-0000-0000-0000-000000000010', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000004', 2),
  ('30000000-0000-0000-0000-000000000011', 'TREASURER',         '00000000-0000-0000-0000-000000000004', 3),
  ('30000000-0000-0000-0000-000000000012', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000004', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Insert NEW Members only
-- NOTE: SHAMMAS K (8590650124) already exists as Zone Media Chairman
--       â†’ No new member record needed, just add a new position link
-- ============================================================
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- PADAPPENGAD CLUSTER (new members)
  ('20000000-0000-0000-0000-000000000029', 'MUHAMMED UVAIS AZHARI', '8590861006', '2026/4357'),
  ('20000000-0000-0000-0000-000000000030', 'NIZAR K V',             '6235930479', '2026/5111'),
  -- SHAMMAS K (8590650124) is already member #23 from Zone Committee â€“ SKIPPED
  ('20000000-0000-0000-0000-000000000031', 'MUHAMMED SHAN K',       '8547864855', '2026/4978'),
  -- KUTTAPARAMB CLUSTER (all new members)
  ('20000000-0000-0000-0000-000000000036', 'SHAMEEL PH',            '9495055337', '2026/5113'),
  ('20000000-0000-0000-0000-000000000037', 'MUHAMMAD ASHIK',        '7907988349', '2026/5330'),
  ('20000000-0000-0000-0000-000000000038', 'MUHAMMED AJNAS A M',    '8129466012', '2026/5681'),
  ('20000000-0000-0000-0000-000000000039', 'MUHAMMED ASLAM KM',     '9544676461', '2026/5670'),
  -- PERUMALABAD CLUSTER (all new members)
  ('20000000-0000-0000-0000-000000000032', 'SHAMSUDHEEN DARIMI P',  '7012328158', '2026/4959'),
  ('20000000-0000-0000-0000-000000000033', 'JUNAID OV',             '9645189049', '2026/4948'),
  ('20000000-0000-0000-0000-000000000034', 'MUHAMMED DARIMI',       '9744641003', '2026/4935'),
  ('20000000-0000-0000-0000-000000000035', 'MUBARAK RAHMAN',        '7902936883', '2026/5583')
ON CONFLICT (mobile) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_number = COALESCE(EXCLUDED.membership_number, members.membership_number);

-- ============================================================
-- Step 4: Link Members to Cluster Positions
-- ============================================================

-- PADAPPENGAD CLUSTER
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id)
SELECT
  mp.member_id, mp.position_id, mp.committee_id,
  c.id AS cluster_id
FROM (VALUES
  ('20000000-0000-0000-0000-000000000029'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- MUHAMMED UVAIS  â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000030'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- NIZAR K V       â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000023'::uuid, '30000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- SHAMMAS K       â†’ TREASURER (already Zone Media Chairman)
  ('20000000-0000-0000-0000-000000000031'::uuid, '30000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)  -- MUHAMMED SHAN K â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id)
CROSS JOIN public.clusters c WHERE c.code = 'PAD'
ON CONFLICT (member_id, position_id) DO NOTHING;

-- KUTTAPARAMB CLUSTER
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id)
SELECT
  mp.member_id, mp.position_id, mp.committee_id,
  c.id AS cluster_id
FROM (VALUES
  ('20000000-0000-0000-0000-000000000036'::uuid, '30000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- SHAMEEL PH       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000037'::uuid, '30000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- MUHAMMAD ASHIK   â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000038'::uuid, '30000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- MUHAMMED AJNAS   â†’ TREASURER
  ('20000000-0000-0000-0000-000000000039'::uuid, '30000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000003'::uuid)  -- MUHAMMED ASLAM   â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id)
CROSS JOIN public.clusters c WHERE c.code = 'KUT'
ON CONFLICT (member_id, position_id) DO NOTHING;

-- PERUMALABAD CLUSTER
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id)
SELECT
  mp.member_id, mp.position_id, mp.committee_id,
  c.id AS cluster_id
FROM (VALUES
  ('20000000-0000-0000-0000-000000000032'::uuid, '30000000-0000-0000-0000-000000000009'::uuid,  '00000000-0000-0000-0000-000000000004'::uuid), -- SHAMSUDHEEN â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000033'::uuid, '30000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000004'::uuid), -- JUNAID OV   â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000034'::uuid, '30000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000004'::uuid), -- MHMD DARIMI â†’ TREASURER
  ('20000000-0000-0000-0000-000000000035'::uuid, '30000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000004'::uuid)  -- MUBARAK     â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id)
CROSS JOIN public.clusters c WHERE c.code = 'PER'
ON CONFLICT (member_id, position_id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
  c.name AS cluster,
  p.title AS position,
  m.full_name,
  m.mobile,
  m.membership_number
FROM public.member_positions mp
JOIN public.members m ON m.id = mp.member_id
JOIN public.positions p ON p.id = mp.position_id
JOIN public.committees c ON c.id = mp.committee_id
WHERE c.level = 'cluster'
ORDER BY c.name, p.sort_order;


-- ============================================================
-- SEED: KUTTAPARAMB UNITS
-- ============================================================
-- ============================================================
-- KUTTAPARAMB CLUSTER â€“ 6 UNIT COMMITTEES SEED DATA
-- Run after seed_cluster_committees.sql
-- ============================================================
-- Multi-position members (already in DB, no new member record):
--   SHAHID OP        (9847900075) = member 20000000-...-000000000010
--   NIZAMUDHEEN K P  (9061295670) = member 20000000-...-000000000019
--   MUHAMMED ASLAM KM(9544676461) = member 20000000-...-000000000039
--   AFSAL RAHMANI    (9947527941) = member 20000000-...-000000000014
-- ============================================================

-- ============================================================
-- Step 1: Insert 6 Units under Kuttaparamb Cluster
-- ============================================================
INSERT INTO public.units (id, name, cluster_id, sort_order)
SELECT u.id, u.name, c.id, u.sort_order
FROM (VALUES
  ('00000000-0000-0000-0002-000000000001'::uuid, 'KUTTAPARAMB UNIT', 1),
  ('00000000-0000-0000-0002-000000000002'::uuid, 'RAYAROM UNIT',     2),
  ('00000000-0000-0000-0002-000000000003'::uuid, 'THADIKKADAV UNIT', 3),
  ('00000000-0000-0000-0002-000000000004'::uuid, 'NEDUVOODE UNIT',   4),
  ('00000000-0000-0000-0002-000000000005'::uuid, 'MUNNAMKUNNU UNIT', 5),
  ('00000000-0000-0000-0002-000000000006'::uuid, 'KARUVANCHAL UNIT', 6)
) AS u(id, name, sort_order)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'KUT') AS c
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Create Unit Committee records (level = 'unit')
-- ============================================================
INSERT INTO public.committees (id, name, level, cluster_id, unit_id)
SELECT com.id, com.name, 'unit', cl.id, com.unit_id
FROM (VALUES
  ('00000000-0000-0000-0000-000000000010'::uuid, 'KUTTAPARAMB UNIT COMMITTEE', '00000000-0000-0000-0002-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000011'::uuid, 'RAYAROM UNIT COMMITTEE',     '00000000-0000-0000-0002-000000000002'::uuid),
  ('00000000-0000-0000-0000-000000000012'::uuid, 'THADIKKADAV UNIT COMMITTEE', '00000000-0000-0000-0002-000000000003'::uuid),
  ('00000000-0000-0000-0000-000000000013'::uuid, 'NEDUVOODE UNIT COMMITTEE',   '00000000-0000-0000-0002-000000000004'::uuid),
  ('00000000-0000-0000-0000-000000000014'::uuid, 'MUNNAMKUNNU UNIT COMMITTEE', '00000000-0000-0000-0002-000000000005'::uuid),
  ('00000000-0000-0000-0000-000000000015'::uuid, 'KARUVANCHAL UNIT COMMITTEE', '00000000-0000-0000-0002-000000000006'::uuid)
) AS com(id, name, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'KUT') AS cl
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Insert 4 Positions per Unit (24 total)
-- ============================================================
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  -- KUTTAPARAMB UNIT
  ('40000000-0000-0000-0001-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000010', 1),
  ('40000000-0000-0000-0001-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000010', 2),
  ('40000000-0000-0000-0001-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000010', 3),
  ('40000000-0000-0000-0001-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000010', 4),
  -- RAYAROM UNIT
  ('40000000-0000-0000-0002-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000011', 1),
  ('40000000-0000-0000-0002-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000011', 2),
  ('40000000-0000-0000-0002-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000011', 3),
  ('40000000-0000-0000-0002-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000011', 4),
  -- THADIKKADAV UNIT
  ('40000000-0000-0000-0003-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000012', 1),
  ('40000000-0000-0000-0003-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000012', 2),
  ('40000000-0000-0000-0003-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000012', 3),
  ('40000000-0000-0000-0003-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000012', 4),
  -- NEDUVOODE UNIT
  ('40000000-0000-0000-0004-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000013', 1),
  ('40000000-0000-0000-0004-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000013', 2),
  ('40000000-0000-0000-0004-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000013', 3),
  ('40000000-0000-0000-0004-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000013', 4),
  -- MUNNAMKUNNU UNIT
  ('40000000-0000-0000-0005-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000014', 1),
  ('40000000-0000-0000-0005-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000014', 2),
  ('40000000-0000-0000-0005-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000014', 3),
  ('40000000-0000-0000-0005-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000014', 4),
  -- KARUVANCHAL UNIT
  ('40000000-0000-0000-0006-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000015', 1),
  ('40000000-0000-0000-0006-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000015', 2),
  ('40000000-0000-0000-0006-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000015', 3),
  ('40000000-0000-0000-0006-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000015', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 4: Insert NEW Members only
-- (Multi-position members already exist â€“ only new ones inserted)
-- ============================================================
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- KUTTAPARAMB UNIT new members
  -- SHAHID OP       (9847900075) â†’ already Zone Joint Secretary â€“ SKIPPED
  -- NIZAMUDHEEN K P (9061295670) â†’ already Zone Secretariat Member â€“ SKIPPED
  -- MUHAMMED ASLAM KM(9544676461)â†’ already KUT Cluster Working Sec â€“ SKIPPED
  ('20000000-0000-0000-0000-000000000040', 'MUHAMMED RAASHID KV',    '9645242227', '2026/5672'),
  -- RAYAROM UNIT
  ('20000000-0000-0000-0000-000000000041', 'MUHAMMED ASHIQUE UV',    '7560895182', '2026/5397'),
  ('20000000-0000-0000-0000-000000000042', 'ANSARY',                 '9847387578', '2026/5408'),
  ('20000000-0000-0000-0000-000000000043', 'MUHAMMED SIYAD',         '8590506845', '2026/5396'),
  ('20000000-0000-0000-0000-000000000044', 'RAHIL',                  '6282062103', '2026/5404'),
  -- THADIKKADAV UNIT
  ('20000000-0000-0000-0000-000000000045', 'MUHAMMAD SAFWAN PJ',     '8590663227', '2026/5370'),
  ('20000000-0000-0000-0000-000000000046', 'IRSHAD M',               '9207677087', '2026/5332'),  -- different from Zone IRSHAD M
  ('20000000-0000-0000-0000-000000000047', 'MUHAMMAD RAYEES C',      '7902825052', '2026/5381'),
  ('20000000-0000-0000-0000-000000000048', 'NIHAL MUHAMMAD',         '8848445813', '2026/5422'),
  -- NEDUVOODE UNIT
  ('20000000-0000-0000-0000-000000000049', 'SHUHAIR P',              '9544157991', '2026/5055'),
  ('20000000-0000-0000-0000-000000000050', 'MUHAMMED ASHIF P A',     '9188304316', '2026/5012'),
  ('20000000-0000-0000-0000-000000000051', 'MUHAMMAD MUBASHIR P M',  '7907946689', '2026/5430'),
  ('20000000-0000-0000-0000-000000000052', 'THABSHEER P M',          '7907255470', '2026/5364'),
  -- MUNNAMKUNNU UNIT
  ('20000000-0000-0000-0000-000000000053', 'JASEEL KK',              '8547141582', '2026/5640'),
  ('20000000-0000-0000-0000-000000000054', 'SHAFEEQ OM',             '8075292227', '2026/4907'),
  ('20000000-0000-0000-0000-000000000055', 'MUNAVIR CV',             '7025570986', '2026/5644'),
  ('20000000-0000-0000-0000-000000000056', 'ALTHAF PC',              '8281626606', '2026/5449'),
  -- KARUVANCHAL UNIT new members
  -- AFSAL RAHMANI (9947527941) â†’ already Zone Secretariat Member â€“ SKIPPED
  ('20000000-0000-0000-0000-000000000057', 'ABI THAHIR V E',         '9747938093', '2026/5734'),
  ('20000000-0000-0000-0000-000000000058', 'MUHAMMED AJMAL E P',     '8086793507', '2026/5712'),
  ('20000000-0000-0000-0000-000000000059', 'MUHAMMED SAFWAN K A',    '9072814198', '2026/5720')
ON CONFLICT (mobile) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_number = COALESCE(EXCLUDED.membership_number, members.membership_number);

-- ============================================================
-- Step 5: Link Members to Unit Positions
-- ============================================================
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id, unit_id)
SELECT mp.member_id, mp.position_id, mp.committee_id, cl.id, mp.unit_id
FROM (VALUES
  -- â”€â”€ KUTTAPARAMB UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000010'::uuid, '40000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0002-000000000001'::uuid), -- SHAHID OP       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000019'::uuid, '40000000-0000-0000-0001-000000000002'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0002-000000000001'::uuid), -- NIZAMUDHEEN K P â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000039'::uuid, '40000000-0000-0000-0001-000000000003'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0002-000000000001'::uuid), -- MUHAMMED ASLAM  â†’ TREASURER
  ('20000000-0000-0000-0000-000000000040'::uuid, '40000000-0000-0000-0001-000000000004'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0002-000000000001'::uuid), -- MUHAMMED RAASHIDâ†’ WORKING SECRETARY
  -- â”€â”€ RAYAROM UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000041'::uuid, '40000000-0000-0000-0002-000000000001'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0002-000000000002'::uuid), -- MUHAMMED ASHIQUEâ†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000042'::uuid, '40000000-0000-0000-0002-000000000002'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0002-000000000002'::uuid), -- ANSARY          â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000043'::uuid, '40000000-0000-0000-0002-000000000003'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0002-000000000002'::uuid), -- MUHAMMED SIYAD  â†’ TREASURER
  ('20000000-0000-0000-0000-000000000044'::uuid, '40000000-0000-0000-0002-000000000004'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0002-000000000002'::uuid), -- RAHIL           â†’ WORKING SECRETARY
  -- â”€â”€ THADIKKADAV UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000045'::uuid, '40000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0002-000000000003'::uuid), -- SAFWAN PJ       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000046'::uuid, '40000000-0000-0000-0003-000000000002'::uuid, '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0002-000000000003'::uuid), -- IRSHAD M        â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000047'::uuid, '40000000-0000-0000-0003-000000000003'::uuid, '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0002-000000000003'::uuid), -- MUHAMMAD RAYEES â†’ TREASURER
  ('20000000-0000-0000-0000-000000000048'::uuid, '40000000-0000-0000-0003-000000000004'::uuid, '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0002-000000000003'::uuid), -- NIHAL MUHAMMAD  â†’ WORKING SECRETARY
  -- â”€â”€ NEDUVOODE UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000049'::uuid, '40000000-0000-0000-0004-000000000001'::uuid, '00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0002-000000000004'::uuid), -- SHUHAIR P       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000050'::uuid, '40000000-0000-0000-0004-000000000002'::uuid, '00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0002-000000000004'::uuid), -- MUHAMMED ASHIF  â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000051'::uuid, '40000000-0000-0000-0004-000000000003'::uuid, '00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0002-000000000004'::uuid), -- MUHAMMAD MUBASHIRâ†’TREASURER
  ('20000000-0000-0000-0000-000000000052'::uuid, '40000000-0000-0000-0004-000000000004'::uuid, '00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0002-000000000004'::uuid), -- THABSHEER P M   â†’ WORKING SECRETARY
  -- â”€â”€ MUNNAMKUNNU UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000053'::uuid, '40000000-0000-0000-0005-000000000001'::uuid, '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0002-000000000005'::uuid), -- JASEEL KK       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000054'::uuid, '40000000-0000-0000-0005-000000000002'::uuid, '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0002-000000000005'::uuid), -- SHAFEEQ OM      â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000055'::uuid, '40000000-0000-0000-0005-000000000003'::uuid, '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0002-000000000005'::uuid), -- MUNAVIR CV      â†’ TREASURER
  ('20000000-0000-0000-0000-000000000056'::uuid, '40000000-0000-0000-0005-000000000004'::uuid, '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0002-000000000005'::uuid), -- ALTHAF PC       â†’ WORKING SECRETARY
  -- â”€â”€ KARUVANCHAL UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000014'::uuid, '40000000-0000-0000-0006-000000000001'::uuid, '00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0002-000000000006'::uuid), -- AFSAL RAHMANI   â†’ PRESIDENT (Zone Sec Member too)
  ('20000000-0000-0000-0000-000000000057'::uuid, '40000000-0000-0000-0006-000000000002'::uuid, '00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0002-000000000006'::uuid), -- ABI THAHIR      â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000058'::uuid, '40000000-0000-0000-0006-000000000003'::uuid, '00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0002-000000000006'::uuid), -- MUHAMMED AJMAL  â†’ TREASURER
  ('20000000-0000-0000-0000-000000000059'::uuid, '40000000-0000-0000-0006-000000000004'::uuid, '00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0002-000000000006'::uuid)  -- MUHAMMED SAFWAN â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'KUT') AS cl
ON CONFLICT (member_id, position_id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
  u.name AS unit,
  p.title AS position,
  m.full_name,
  m.mobile,
  m.membership_number
FROM public.member_positions mp
JOIN public.members m ON m.id = mp.member_id
JOIN public.positions p ON p.id = mp.position_id
JOIN public.units u ON u.id = mp.unit_id
JOIN public.clusters cl ON cl.id = u.cluster_id
WHERE cl.code = 'KUT'
ORDER BY u.sort_order, p.sort_order;


-- ============================================================
-- SEED: PERUMALABAD UNITS
-- ============================================================
-- ============================================================
-- PERUMALABAD CLUSTER â€“ 4 UNIT COMMITTEES SEED DATA
-- Run after seed_cluster_committees.sql
-- ============================================================
-- Multi-position members (already in DB):
--   IRSHAD M (7510221259) = member 20000000-...-000000000021
--   (Zone Secretariat Member â†’ Mangara Badariyya Nagar Unit President)
-- ============================================================

-- ============================================================
-- Step 1: Insert 4 Units under Perumalabad Cluster
-- ============================================================
INSERT INTO public.units (id, name, cluster_id, sort_order)
SELECT u.id, u.name, c.id, u.sort_order
FROM (VALUES
  ('00000000-0000-0000-0003-000000000001'::uuid, 'PERUVANA UNIT',                 1),
  ('00000000-0000-0000-0003-000000000002'::uuid, 'ERUVATTI UNIT',                 2),
  ('00000000-0000-0000-0003-000000000003'::uuid, 'MANGARA BADARIYYA NAGAR UNIT',  3),
  ('00000000-0000-0000-0003-000000000004'::uuid, 'PERUMALABAD UNIT',              4)
) AS u(id, name, sort_order)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PER') AS c
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Create Unit Committee records (level = 'unit')
-- ============================================================
INSERT INTO public.committees (id, name, level, cluster_id, unit_id)
SELECT com.id, com.name, 'unit', cl.id, com.unit_id
FROM (VALUES
  ('00000000-0000-0000-0000-000000000020'::uuid, 'PERUVANA UNIT COMMITTEE',                '00000000-0000-0000-0003-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000021'::uuid, 'ERUVATTI UNIT COMMITTEE',                '00000000-0000-0000-0003-000000000002'::uuid),
  ('00000000-0000-0000-0000-000000000022'::uuid, 'MANGARA BADARIYYA NAGAR UNIT COMMITTEE', '00000000-0000-0000-0003-000000000003'::uuid),
  ('00000000-0000-0000-0000-000000000023'::uuid, 'PERUMALABAD UNIT COMMITTEE',             '00000000-0000-0000-0003-000000000004'::uuid)
) AS com(id, name, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PER') AS cl
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Insert 4 Positions per Unit (16 total)
-- ============================================================
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  -- PERUVANA UNIT
  ('60000000-0000-0000-0001-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000020', 1),
  ('60000000-0000-0000-0001-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000020', 2),
  ('60000000-0000-0000-0001-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000020', 3),
  ('60000000-0000-0000-0001-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000020', 4),
  -- ERUVATTI UNIT
  ('60000000-0000-0000-0002-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000021', 1),
  ('60000000-0000-0000-0002-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000021', 2),
  ('60000000-0000-0000-0002-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000021', 3),
  ('60000000-0000-0000-0002-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000021', 4),
  -- MANGARA BADARIYYA NAGAR UNIT
  ('60000000-0000-0000-0003-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000022', 1),
  ('60000000-0000-0000-0003-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000022', 2),
  ('60000000-0000-0000-0003-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000022', 3),
  ('60000000-0000-0000-0003-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000022', 4),
  -- PERUMALABAD UNIT
  ('60000000-0000-0000-0004-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000023', 1),
  ('60000000-0000-0000-0004-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000023', 2),
  ('60000000-0000-0000-0004-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000023', 3),
  ('60000000-0000-0000-0004-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000023', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 4: Insert NEW Members only
-- ============================================================
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- PERUVANA UNIT (all new)
  ('20000000-0000-0000-0000-000000000060', 'ZAKKARIYA HUDAWI',       '7034240285', '2026/4881'),
  ('20000000-0000-0000-0000-000000000061', 'MUHAMMAD SWALIH K M',    '8590177615', '2026/5676'),
  ('20000000-0000-0000-0000-000000000062', 'MUJITHABA MM',           '9526837885', '2026/5159'),
  ('20000000-0000-0000-0000-000000000063', 'ABDULLA OC',             '9061211254', '2026/5446'),
  -- ERUVATTI UNIT (all new)
  ('20000000-0000-0000-0000-000000000064', 'MUHAMMED SAYD RAHMANI',  '7025981986', '2026/4922'),
  ('20000000-0000-0000-0000-000000000065', 'MUHAMMED SHAFEEQUE PK',  '9446111193', '2026/5198'),
  ('20000000-0000-0000-0000-000000000066', 'NIZAMUDHEEN KV',         '9745557649', '2026/5285'),  -- different from NIZAMUDHEEN K P
  ('20000000-0000-0000-0000-000000000067', 'MUHAMMAD RAZI OK',       '8086271797', '2026/5356'),
  -- MANGARA BADARIYYA NAGAR UNIT
  -- IRSHAD M (7510221259, 2026/4892) â†’ already Zone Secretariat Member #21 â€“ SKIPPED
  ('20000000-0000-0000-0000-000000000068', 'MUHAMMED MUNAID K C',    '7510484552', '2026/4958'),
  ('20000000-0000-0000-0000-000000000069', 'ASSAINAR P',             '8589805429', '2026/5130'),
  ('20000000-0000-0000-0000-000000000070', 'JASEEM K',               '9744390850', '2026/4957'),
  -- PERUMALABAD UNIT (all new)
  ('20000000-0000-0000-0000-000000000071', 'RASHID ASADI',           '9744355613', '2026/4949'),
  ('20000000-0000-0000-0000-000000000072', 'JALEEL FAISY IRFANI',    '9961292787', '2026/5645'),
  ('20000000-0000-0000-0000-000000000073', 'MUHAMMED ADIB VV',       '8848783075', '2026/4953'),
  ('20000000-0000-0000-0000-000000000074', 'SALEEM ASADI',           '8590747494', '2026/4950')
ON CONFLICT (mobile) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_number = COALESCE(EXCLUDED.membership_number, members.membership_number);

-- ============================================================
-- Step 5: Link Members to Unit Positions
-- ============================================================
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id, unit_id)
SELECT mp.member_id, mp.position_id, mp.committee_id, cl.id, mp.unit_id
FROM (VALUES
  -- â”€â”€ PERUVANA UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000060'::uuid, '60000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0003-000000000001'::uuid), -- ZAKKARIYA       â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000061'::uuid, '60000000-0000-0000-0001-000000000002'::uuid, '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0003-000000000001'::uuid), -- MUHAMMAD SWALIH â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000062'::uuid, '60000000-0000-0000-0001-000000000003'::uuid, '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0003-000000000001'::uuid), -- MUJITHABA MM    â†’ TREASURER
  ('20000000-0000-0000-0000-000000000063'::uuid, '60000000-0000-0000-0001-000000000004'::uuid, '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0003-000000000001'::uuid), -- ABDULLA OC      â†’ WORKING SECRETARY
  -- â”€â”€ ERUVATTI UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000064'::uuid, '60000000-0000-0000-0002-000000000001'::uuid, '00000000-0000-0000-0000-000000000021'::uuid, '00000000-0000-0000-0003-000000000002'::uuid), -- SAYD RAHMANI    â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000065'::uuid, '60000000-0000-0000-0002-000000000002'::uuid, '00000000-0000-0000-0000-000000000021'::uuid, '00000000-0000-0000-0003-000000000002'::uuid), -- SHAFEEQUE PK    â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000066'::uuid, '60000000-0000-0000-0002-000000000003'::uuid, '00000000-0000-0000-0000-000000000021'::uuid, '00000000-0000-0000-0003-000000000002'::uuid), -- NIZAMUDHEEN KV  â†’ TREASURER
  ('20000000-0000-0000-0000-000000000067'::uuid, '60000000-0000-0000-0002-000000000004'::uuid, '00000000-0000-0000-0000-000000000021'::uuid, '00000000-0000-0000-0003-000000000002'::uuid), -- MUHAMMAD RAZI   â†’ WORKING SECRETARY
  -- â”€â”€ MANGARA BADARIYYA NAGAR UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000021'::uuid, '60000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0003-000000000003'::uuid), -- IRSHAD M        â†’ PRESIDENT (â­ Zone Sec Member)
  ('20000000-0000-0000-0000-000000000068'::uuid, '60000000-0000-0000-0003-000000000002'::uuid, '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0003-000000000003'::uuid), -- MUHAMMED MUNAID â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000069'::uuid, '60000000-0000-0000-0003-000000000003'::uuid, '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0003-000000000003'::uuid), -- ASSAINAR P      â†’ TREASURER
  ('20000000-0000-0000-0000-000000000070'::uuid, '60000000-0000-0000-0003-000000000004'::uuid, '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0003-000000000003'::uuid), -- JASEEM K        â†’ WORKING SECRETARY
  -- â”€â”€ PERUMALABAD UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000071'::uuid, '60000000-0000-0000-0004-000000000001'::uuid, '00000000-0000-0000-0000-000000000023'::uuid, '00000000-0000-0000-0003-000000000004'::uuid), -- RASHID ASADI    â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000072'::uuid, '60000000-0000-0000-0004-000000000002'::uuid, '00000000-0000-0000-0000-000000000023'::uuid, '00000000-0000-0000-0003-000000000004'::uuid), -- JALEEL FAISY    â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000073'::uuid, '60000000-0000-0000-0004-000000000003'::uuid, '00000000-0000-0000-0000-000000000023'::uuid, '00000000-0000-0000-0003-000000000004'::uuid), -- MUHAMMED ADIB   â†’ TREASURER
  ('20000000-0000-0000-0000-000000000074'::uuid, '60000000-0000-0000-0004-000000000004'::uuid, '00000000-0000-0000-0000-000000000023'::uuid, '00000000-0000-0000-0003-000000000004'::uuid)  -- SALEEM ASADI    â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PER') AS cl
ON CONFLICT (member_id, position_id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
  u.name AS unit,
  p.title AS position,
  m.full_name,
  m.mobile,
  m.membership_number
FROM public.member_positions mp
JOIN public.members m ON m.id = mp.member_id
JOIN public.positions p ON p.id = mp.position_id
JOIN public.units u ON u.id = mp.unit_id
JOIN public.clusters cl ON cl.id = u.cluster_id
WHERE cl.code = 'PER'
ORDER BY u.sort_order, p.sort_order;


-- ============================================================
-- SEED: PADAPPENGAD UNITS
-- ============================================================
-- ============================================================
-- PADAPPENGAD CLUSTER â€“ 6 UNIT COMMITTEES SEED DATA
-- Run after seed_cluster_committees.sql
-- ============================================================
-- Multi-position members (already in DB â€“ SKIPPED from INSERT):
--   MUHAMMED NAFIH KV  (8547995318) = member #17 â†’ Zone Secretariat Member  + Shanthigiri Treasurer
--   ARSHAD P           (8590909112) = member #16 â†’ Zone Secretariat Member  + Padappengad Unit President
--   NIZAR K V          (6235930479) = member #30 â†’ PAD Cluster Gen. Sec     + Naduvil Working Secretary
--   NISAMUDDEEN P K    (9747581763) = member #27 â†’ Zone Campus Chairman     + Elamberam Para President
--   MUHAJIR K          (9744149743) = member #4  â†’ Zone Working Secretary   + Elamberam Para Gen. Sec
--   ABDULLA ASADI NADWI(9747375433) = member #22 â†’ Zone IBAD Chairman       + Chapparappadav Unit Gen. Sec
-- ============================================================

-- ============================================================
-- Step 1: Insert 6 Units under Padappengad Cluster
-- ============================================================
INSERT INTO public.units (id, name, cluster_id, sort_order)
SELECT u.id, u.name, c.id, u.sort_order
FROM (VALUES
  ('00000000-0000-0000-0001-000000000001'::uuid, 'SHANTHIGIRI UNIT',     1),
  ('00000000-0000-0000-0001-000000000002'::uuid, 'VILAKKANNOOR UNIT',    2),
  ('00000000-0000-0000-0001-000000000003'::uuid, 'PADAPPENGAD UNIT',     3),
  ('00000000-0000-0000-0001-000000000004'::uuid, 'NADUVIL UNIT',         4),
  ('00000000-0000-0000-0001-000000000005'::uuid, 'ELAMBERAM PARA UNIT',  5),
  ('00000000-0000-0000-0001-000000000006'::uuid, 'CHAPPARAPPADAV UNIT',  6)
) AS u(id, name, sort_order)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PAD') AS c
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Create Unit Committee records (level = 'unit')
-- ============================================================
INSERT INTO public.committees (id, name, level, cluster_id, unit_id)
SELECT com.id, com.name, 'unit', cl.id, com.unit_id
FROM (VALUES
  ('00000000-0000-0000-0000-000000000030'::uuid, 'SHANTHIGIRI UNIT COMMITTEE',    '00000000-0000-0000-0001-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000031'::uuid, 'VILAKKANNOOR UNIT COMMITTEE',   '00000000-0000-0000-0001-000000000002'::uuid),
  ('00000000-0000-0000-0000-000000000032'::uuid, 'PADAPPENGAD UNIT COMMITTEE',    '00000000-0000-0000-0001-000000000003'::uuid),
  ('00000000-0000-0000-0000-000000000033'::uuid, 'NADUVIL UNIT COMMITTEE',        '00000000-0000-0000-0001-000000000004'::uuid),
  ('00000000-0000-0000-0000-000000000034'::uuid, 'ELAMBERAM PARA UNIT COMMITTEE', '00000000-0000-0000-0001-000000000005'::uuid),
  ('00000000-0000-0000-0000-000000000035'::uuid, 'CHAPPARAPPADAV UNIT COMMITTEE', '00000000-0000-0000-0001-000000000006'::uuid)
) AS com(id, name, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PAD') AS cl
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Insert 4 Positions per Unit (24 total)
-- ============================================================
INSERT INTO public.positions (id, title, committee_id, sort_order) VALUES
  -- SHANTHIGIRI UNIT
  ('50000000-0000-0000-0001-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000030', 1),
  ('50000000-0000-0000-0001-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000030', 2),
  ('50000000-0000-0000-0001-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000030', 3),
  ('50000000-0000-0000-0001-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000030', 4),
  -- VILAKKANNOOR UNIT
  ('50000000-0000-0000-0002-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000031', 1),
  ('50000000-0000-0000-0002-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000031', 2),
  ('50000000-0000-0000-0002-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000031', 3),
  ('50000000-0000-0000-0002-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000031', 4),
  -- PADAPPENGAD UNIT
  ('50000000-0000-0000-0003-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000032', 1),
  ('50000000-0000-0000-0003-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000032', 2),
  ('50000000-0000-0000-0003-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000032', 3),
  ('50000000-0000-0000-0003-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000032', 4),
  -- NADUVIL UNIT
  ('50000000-0000-0000-0004-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000033', 1),
  ('50000000-0000-0000-0004-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000033', 2),
  ('50000000-0000-0000-0004-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000033', 3),
  ('50000000-0000-0000-0004-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000033', 4),
  -- ELAMBERAM PARA UNIT
  ('50000000-0000-0000-0005-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000034', 1),
  ('50000000-0000-0000-0005-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000034', 2),
  ('50000000-0000-0000-0005-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000034', 3),
  ('50000000-0000-0000-0005-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000034', 4),
  -- CHAPPARAPPADAV UNIT
  ('50000000-0000-0000-0006-000000000001', 'PRESIDENT',         '00000000-0000-0000-0000-000000000035', 1),
  ('50000000-0000-0000-0006-000000000002', 'GENERAL SECRETARY', '00000000-0000-0000-0000-000000000035', 2),
  ('50000000-0000-0000-0006-000000000003', 'TREASURER',         '00000000-0000-0000-0000-000000000035', 3),
  ('50000000-0000-0000-0006-000000000004', 'WORKING SECRETARY', '00000000-0000-0000-0000-000000000035', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 4: Insert NEW Members only
-- ============================================================
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- SHANTHIGIRI UNIT (MUHAMMED NAFIH KV already member #17 â€“ SKIPPED)
  ('20000000-0000-0000-0000-000000000075', 'KHALIFA BIN ABDULL FATHAH', '7510648318', '2026/5162'),
  ('20000000-0000-0000-0000-000000000076', 'HAMDHAN HYDER',             '7510945363', '2026/4933'),
  ('20000000-0000-0000-0000-000000000077', 'MUHAMMED SHAHID P',         '9544152585', '2026/4941'),
  -- VILAKKANNOOR UNIT (all new)
  ('20000000-0000-0000-0000-000000000078', 'ANWAR KAMIL AL ASHARI',     '8547994808', '2026/5051'),
  ('20000000-0000-0000-0000-000000000079', 'AJNAS KP',                  '9744597523', '2026/5053'),
  ('20000000-0000-0000-0000-000000000080', 'ASSAIN K',                  '9446773627', '2026/5472'),
  ('20000000-0000-0000-0000-000000000081', 'ABDUL RASHEED KP',          '9605203476', '2026/5631'),
  -- PADAPPENGAD UNIT (ARSHAD P already member #16 â€“ SKIPPED)
  ('20000000-0000-0000-0000-000000000082', 'ANSAB CK',                  '8848492409', '2026/5591'),
  ('20000000-0000-0000-0000-000000000083', 'MUHAMMED YASEEN K',         '6235225975', '2026/4928'),
  ('20000000-0000-0000-0000-000000000084', 'BASIL N',                   '9074909740', '2026/5196'),
  -- NADUVIL UNIT (NIZAR K V already member #30 â€“ SKIPPED)
  ('20000000-0000-0000-0000-000000000085', 'MOHAMED ARSHAD',            '8330822193', '2026/4883'),
  ('20000000-0000-0000-0000-000000000086', 'MUHAMMED NAFIH K',          '6235264373', '2026/5099'),  -- different from NAFIH KV
  ('20000000-0000-0000-0000-000000000087', 'ISMAL MP',                  '9562044970', '2026/5043'),
  -- ELAMBERAM PARA UNIT (NISAMUDDEEN P K member #27, MUHAJIR K member #4 â€“ SKIPPED)
  ('20000000-0000-0000-0000-000000000088', 'NAVAF ARIF',                '9048778074', '2026/4997'),
  ('20000000-0000-0000-0000-000000000089', 'FAHEEM P K',                '9656986775', '2026/4971'),
  -- CHAPPARAPPADAV UNIT (ABDULLA ASADI NADWI already member #22 â€“ SKIPPED)
  ('20000000-0000-0000-0000-000000000090', 'MINHAJ M',                  '9605725522', '2026/5058'),
  ('20000000-0000-0000-0000-000000000091', 'MUHAMMED SINAN K',          '9188060513', '2026/5301'),
  ('20000000-0000-0000-0000-000000000092', 'MUHAMMED HASSAN C P',       '9656166030', '2026/4993')
ON CONFLICT (mobile) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_number = COALESCE(EXCLUDED.membership_number, members.membership_number);

-- ============================================================
-- Step 5: Link Members to Unit Positions
-- ============================================================
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id, unit_id)
SELECT mp.member_id, mp.position_id, mp.committee_id, cl.id, mp.unit_id
FROM (VALUES
  -- â”€â”€ SHANTHIGIRI UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000075'::uuid, '50000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0001-000000000001'::uuid), -- KHALIFA          â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000076'::uuid, '50000000-0000-0000-0001-000000000002'::uuid, '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0001-000000000001'::uuid), -- HAMDHAN HYDER    â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000017'::uuid, '50000000-0000-0000-0001-000000000003'::uuid, '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0001-000000000001'::uuid), -- MUHAMMED NAFIH KVâ†’ TREASURER (â­ Zone Sec Member)
  ('20000000-0000-0000-0000-000000000077'::uuid, '50000000-0000-0000-0001-000000000004'::uuid, '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0001-000000000001'::uuid), -- MUHAMMED SHAHID  â†’ WORKING SECRETARY
  -- â”€â”€ VILAKKANNOOR UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000078'::uuid, '50000000-0000-0000-0002-000000000001'::uuid, '00000000-0000-0000-0000-000000000031'::uuid, '00000000-0000-0000-0001-000000000002'::uuid), -- ANWAR KAMIL      â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000079'::uuid, '50000000-0000-0000-0002-000000000002'::uuid, '00000000-0000-0000-0000-000000000031'::uuid, '00000000-0000-0000-0001-000000000002'::uuid), -- AJNAS KP         â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000080'::uuid, '50000000-0000-0000-0002-000000000003'::uuid, '00000000-0000-0000-0000-000000000031'::uuid, '00000000-0000-0000-0001-000000000002'::uuid), -- ASSAIN K         â†’ TREASURER
  ('20000000-0000-0000-0000-000000000081'::uuid, '50000000-0000-0000-0002-000000000004'::uuid, '00000000-0000-0000-0000-000000000031'::uuid, '00000000-0000-0000-0001-000000000002'::uuid), -- ABDUL RASHEED KP â†’ WORKING SECRETARY
  -- â”€â”€ PADAPPENGAD UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000016'::uuid, '50000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0000-000000000032'::uuid, '00000000-0000-0000-0001-000000000003'::uuid), -- ARSHAD P         â†’ PRESIDENT (â­ Zone Sec Member)
  ('20000000-0000-0000-0000-000000000082'::uuid, '50000000-0000-0000-0003-000000000002'::uuid, '00000000-0000-0000-0000-000000000032'::uuid, '00000000-0000-0000-0001-000000000003'::uuid), -- ANSAB CK         â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000083'::uuid, '50000000-0000-0000-0003-000000000003'::uuid, '00000000-0000-0000-0000-000000000032'::uuid, '00000000-0000-0000-0001-000000000003'::uuid), -- MUHAMMED YASEEN  â†’ TREASURER
  ('20000000-0000-0000-0000-000000000084'::uuid, '50000000-0000-0000-0003-000000000004'::uuid, '00000000-0000-0000-0000-000000000032'::uuid, '00000000-0000-0000-0001-000000000003'::uuid), -- BASIL N          â†’ WORKING SECRETARY
  -- â”€â”€ NADUVIL UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000085'::uuid, '50000000-0000-0000-0004-000000000001'::uuid, '00000000-0000-0000-0000-000000000033'::uuid, '00000000-0000-0000-0001-000000000004'::uuid), -- MOHAMED ARSHAD   â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000086'::uuid, '50000000-0000-0000-0004-000000000002'::uuid, '00000000-0000-0000-0000-000000000033'::uuid, '00000000-0000-0000-0001-000000000004'::uuid), -- MUHAMMED NAFIH K â†’ GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000087'::uuid, '50000000-0000-0000-0004-000000000003'::uuid, '00000000-0000-0000-0000-000000000033'::uuid, '00000000-0000-0000-0001-000000000004'::uuid), -- ISMAL MP         â†’ TREASURER
  ('20000000-0000-0000-0000-000000000030'::uuid, '50000000-0000-0000-0004-000000000004'::uuid, '00000000-0000-0000-0000-000000000033'::uuid, '00000000-0000-0000-0001-000000000004'::uuid), -- NIZAR K V        â†’ WORKING SECRETARY (â­ PAD Cluster Gen. Sec)
  -- â”€â”€ ELAMBERAM PARA UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000027'::uuid, '50000000-0000-0000-0005-000000000001'::uuid, '00000000-0000-0000-0000-000000000034'::uuid, '00000000-0000-0000-0001-000000000005'::uuid), -- NISAMUDDEEN P K  â†’ PRESIDENT (â­ Zone Campus Chairman)
  ('20000000-0000-0000-0000-000000000004'::uuid, '50000000-0000-0000-0005-000000000002'::uuid, '00000000-0000-0000-0000-000000000034'::uuid, '00000000-0000-0000-0001-000000000005'::uuid), -- MUHAJIR K        â†’ GENERAL SECRETARY (â­ Zone Working Secretary)
  ('20000000-0000-0000-0000-000000000088'::uuid, '50000000-0000-0000-0005-000000000003'::uuid, '00000000-0000-0000-0000-000000000034'::uuid, '00000000-0000-0000-0001-000000000005'::uuid), -- NAVAF ARIF       â†’ TREASURER
  ('20000000-0000-0000-0000-000000000089'::uuid, '50000000-0000-0000-0005-000000000004'::uuid, '00000000-0000-0000-0000-000000000034'::uuid, '00000000-0000-0000-0001-000000000005'::uuid), -- FAHEEM P K       â†’ WORKING SECRETARY
  -- â”€â”€ CHAPPARAPPADAV UNIT â”€â”€
  ('20000000-0000-0000-0000-000000000090'::uuid, '50000000-0000-0000-0006-000000000001'::uuid, '00000000-0000-0000-0000-000000000035'::uuid, '00000000-0000-0000-0001-000000000006'::uuid), -- MINHAJ M         â†’ PRESIDENT
  ('20000000-0000-0000-0000-000000000022'::uuid, '50000000-0000-0000-0006-000000000002'::uuid, '00000000-0000-0000-0000-000000000035'::uuid, '00000000-0000-0000-0001-000000000006'::uuid), -- ABDULLA ASADI    â†’ GENERAL SECRETARY (â­ Zone IBAD Chairman)
  ('20000000-0000-0000-0000-000000000091'::uuid, '50000000-0000-0000-0006-000000000003'::uuid, '00000000-0000-0000-0000-000000000035'::uuid, '00000000-0000-0000-0001-000000000006'::uuid), -- MUHAMMED SINAN K â†’ TREASURER
  ('20000000-0000-0000-0000-000000000092'::uuid, '50000000-0000-0000-0006-000000000004'::uuid, '00000000-0000-0000-0000-000000000035'::uuid, '00000000-0000-0000-0001-000000000006'::uuid)  -- MUHAMMED HASSAN  â†’ WORKING SECRETARY
) AS mp(member_id, position_id, committee_id, unit_id)
CROSS JOIN (SELECT id FROM public.clusters WHERE code = 'PAD') AS cl
ON CONFLICT (member_id, position_id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
  u.name AS unit,
  p.title AS position,
  m.full_name,
  m.mobile,
  m.membership_number
FROM public.member_positions mp
JOIN public.members m ON m.id = mp.member_id
JOIN public.positions p ON p.id = mp.position_id
JOIN public.units u ON u.id = mp.unit_id
JOIN public.clusters cl ON cl.id = u.cluster_id
WHERE cl.code = 'PAD'
ORDER BY u.sort_order, p.sort_order;


-- ============================================================
-- APP ADMIN ACCOUNT (Mobile: 7559950633 / PIN: 0633)
-- Full Name: MUHSIN MANNANI
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := '7559950633@gmail.com';
  v_password TEXT := '063300';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"MUHSIN MANNANI","role":"admin"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = NOW(),
      raw_user_meta_data = '{"full_name":"MUHSIN MANNANI","role":"admin"}'::jsonb,
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, v_email, 'MUHSIN MANNANI', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'MUHSIN MANNANI',
    email = v_email;
END $$;

-- ============================================================
-- RE-OPEN PROGRAM FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.reopen_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.programs
  SET status = 'active', closed_at = NULL
  WHERE id = p_program_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PUBLIC ATTENDANCE RECORD FUNCTION (Security Definer)
-- ============================================================
CREATE OR REPLACE FUNCTION public.public_record_attendance(
  p_program_id UUID,
  p_member_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_program_status TEXT;
  v_existing UUID;
  v_attendance_id UUID;
  v_member_name TEXT;
BEGIN
  SELECT status INTO v_program_status
  FROM public.programs WHERE id = p_program_id;

  IF v_program_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  IF v_program_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance is currently closed or paused by the admin');
  END IF;

  SELECT full_name INTO v_member_name
  FROM public.members WHERE id = p_member_id;

  IF v_member_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  SELECT id INTO v_existing
  FROM public.attendance
  WHERE program_id = p_program_id AND member_id = p_member_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Attendance already marked for this member',
      'duplicate', true,
      'attendance_id', v_existing
    );
  END IF;

  INSERT INTO public.attendance (program_id, member_id, marked_at)
  VALUES (p_program_id, p_member_id, NOW())
  RETURNING id INTO v_attendance_id;

  RETURN jsonb_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'member_name', v_member_name,
    'marked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PUBLIC POLICIES FOR MEETING LINKS
-- ============================================================
DROP POLICY IF EXISTS "Public view programs" ON public.programs;
CREATE POLICY "Public view programs" ON public.programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view members" ON public.members;
CREATE POLICY "Public view members" ON public.members FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view positions" ON public.positions;
CREATE POLICY "Public view positions" ON public.positions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view member_positions" ON public.member_positions;
CREATE POLICY "Public view member_positions" ON public.member_positions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view committees" ON public.committees;
CREATE POLICY "Public view committees" ON public.committees FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view units" ON public.units;
CREATE POLICY "Public view units" ON public.units FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view clusters" ON public.clusters;
CREATE POLICY "Public view clusters" ON public.clusters FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view attendance" ON public.attendance;
CREATE POLICY "Public view attendance" ON public.attendance FOR SELECT USING (true);

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================

SELECT 'MEMBERS' AS type, COUNT(*) AS total FROM public.members
UNION ALL
SELECT 'COMMITTEES', COUNT(*) FROM public.committees
UNION ALL
SELECT 'POSITIONS', COUNT(*) FROM public.positions
UNION ALL
SELECT 'MEMBER_POSITIONS', COUNT(*) FROM public.member_positions
UNION ALL
SELECT 'UNITS', COUNT(*) FROM public.units
UNION ALL
SELECT 'CLUSTERS', COUNT(*) FROM public.clusters;
