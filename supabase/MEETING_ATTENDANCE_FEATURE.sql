-- ============================================================
-- SKSSF CHAPPARAPPADAVU ZONE – PUBLIC ATTENDANCE & REOPEN MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Function to Start an upcoming program
CREATE OR REPLACE FUNCTION public.start_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.programs
  SET status = 'active', started_at = COALESCE(started_at, NOW()), closed_at = NULL
  WHERE id = p_program_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to Close / Pause an active program
CREATE OR REPLACE FUNCTION public.close_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.programs
  SET status = 'closed', closed_at = NOW()
  WHERE id = p_program_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to Re-Open a closed program (Admin only or Security Definer)
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

-- 4. Function to Permanently Delete a program and all its attendance
CREATE OR REPLACE FUNCTION public.delete_program(p_program_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- First delete attendance records for this program
  DELETE FROM public.attendance WHERE program_id = p_program_id;

  -- Then delete the program
  DELETE FROM public.programs WHERE id = p_program_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Public / Kiosk Attendance Function (Safe, fast, Security Definer)
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
  -- Verify program is active
  SELECT status INTO v_program_status
  FROM public.programs WHERE id = p_program_id;

  IF v_program_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  IF v_program_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance is currently closed or paused by the admin');
  END IF;

  -- Get member name
  SELECT full_name INTO v_member_name
  FROM public.members WHERE id = p_member_id;

  IF v_member_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  -- Check existing attendance
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

  -- Insert attendance
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

-- 3. Grant RLS read access for public attendance links
-- Programs: Allow public to view programs
DROP POLICY IF EXISTS "Public view programs" ON public.programs;
CREATE POLICY "Public view programs" ON public.programs FOR SELECT USING (true);

-- Members: Allow public to lookup active members
DROP POLICY IF EXISTS "Public view members" ON public.members;
CREATE POLICY "Public view members" ON public.members FOR SELECT USING (is_active = true);

-- Positions: Allow public to view positions
DROP POLICY IF EXISTS "Public view positions" ON public.positions;
CREATE POLICY "Public view positions" ON public.positions FOR SELECT USING (true);

-- Member Positions: Allow public to view member positions
DROP POLICY IF EXISTS "Public view member_positions" ON public.member_positions;
CREATE POLICY "Public view member_positions" ON public.member_positions FOR SELECT USING (is_active = true);

-- Committees: Allow public to view committees
DROP POLICY IF EXISTS "Public view committees" ON public.committees;
CREATE POLICY "Public view committees" ON public.committees FOR SELECT USING (is_active = true);

-- Units: Allow public to view units
DROP POLICY IF EXISTS "Public view units" ON public.units;
CREATE POLICY "Public view units" ON public.units FOR SELECT USING (is_active = true);

-- Clusters: Allow public to view clusters
DROP POLICY IF EXISTS "Public view clusters" ON public.clusters;
CREATE POLICY "Public view clusters" ON public.clusters FOR SELECT USING (is_active = true);

-- Attendance: Allow public to read attendance for live counts
DROP POLICY IF EXISTS "Public view attendance" ON public.attendance;
CREATE POLICY "Public view attendance" ON public.attendance FOR SELECT USING (true);
