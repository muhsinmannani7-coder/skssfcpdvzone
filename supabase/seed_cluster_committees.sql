-- ============================================================
-- SKSSF CHAPPARAPPADAVU – CLUSTER COMMITTEES SEED DATA
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
--       → No new member record needed, just add a new position link
-- ============================================================
INSERT INTO public.members (id, full_name, mobile, membership_number) VALUES
  -- PADAPPENGAD CLUSTER (new members)
  ('20000000-0000-0000-0000-000000000029', 'MUHAMMED UVAIS AZHARI', '8590861006', '2026/4357'),
  ('20000000-0000-0000-0000-000000000030', 'NIZAR K V',             '6235930479', '2026/5111'),
  -- SHAMMAS K (8590650124) is already member #23 from Zone Committee – SKIPPED
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
  ('20000000-0000-0000-0000-000000000029'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- MUHAMMED UVAIS  → PRESIDENT
  ('20000000-0000-0000-0000-000000000030'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- NIZAR K V       → GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000023'::uuid, '30000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid), -- SHAMMAS K       → TREASURER (already Zone Media Chairman)
  ('20000000-0000-0000-0000-000000000031'::uuid, '30000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)  -- MUHAMMED SHAN K → WORKING SECRETARY
) AS mp(member_id, position_id, committee_id)
CROSS JOIN public.clusters c WHERE c.code = 'PAD'
ON CONFLICT (member_id, position_id) DO NOTHING;

-- KUTTAPARAMB CLUSTER
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id)
SELECT
  mp.member_id, mp.position_id, mp.committee_id,
  c.id AS cluster_id
FROM (VALUES
  ('20000000-0000-0000-0000-000000000036'::uuid, '30000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- SHAMEEL PH       → PRESIDENT
  ('20000000-0000-0000-0000-000000000037'::uuid, '30000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- MUHAMMAD ASHIK   → GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000038'::uuid, '30000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000003'::uuid), -- MUHAMMED AJNAS   → TREASURER
  ('20000000-0000-0000-0000-000000000039'::uuid, '30000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000003'::uuid)  -- MUHAMMED ASLAM   → WORKING SECRETARY
) AS mp(member_id, position_id, committee_id)
CROSS JOIN public.clusters c WHERE c.code = 'KUT'
ON CONFLICT (member_id, position_id) DO NOTHING;

-- PERUMALABAD CLUSTER
INSERT INTO public.member_positions (member_id, position_id, committee_id, cluster_id)
SELECT
  mp.member_id, mp.position_id, mp.committee_id,
  c.id AS cluster_id
FROM (VALUES
  ('20000000-0000-0000-0000-000000000032'::uuid, '30000000-0000-0000-0000-000000000009'::uuid,  '00000000-0000-0000-0000-000000000004'::uuid), -- SHAMSUDHEEN → PRESIDENT
  ('20000000-0000-0000-0000-000000000033'::uuid, '30000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000004'::uuid), -- JUNAID OV   → GENERAL SECRETARY
  ('20000000-0000-0000-0000-000000000034'::uuid, '30000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000004'::uuid), -- MHMD DARIMI → TREASURER
  ('20000000-0000-0000-0000-000000000035'::uuid, '30000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000004'::uuid)  -- MUBARAK     → WORKING SECRETARY
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
