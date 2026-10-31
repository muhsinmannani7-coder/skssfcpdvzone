import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'skssf-attendance',
    },
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      clusters: { Row: Cluster; Insert: Partial<Cluster>; Update: Partial<Cluster> }
      units: { Row: Unit; Insert: Partial<Unit>; Update: Partial<Unit> }
      committees: { Row: Committee; Insert: Partial<Committee>; Update: Partial<Committee> }
      positions: { Row: Position; Insert: Partial<Position>; Update: Partial<Position> }
      members: { Row: Member; Insert: Partial<Member>; Update: Partial<Member> }
      member_positions: { Row: MemberPosition; Insert: Partial<MemberPosition>; Update: Partial<MemberPosition> }
      sub_wings: { Row: SubWing; Insert: Partial<SubWing>; Update: Partial<SubWing> }
      attendance_operators: { Row: AttendanceOperator; Insert: Partial<AttendanceOperator>; Update: Partial<AttendanceOperator> }
      programs: { Row: Program; Insert: Partial<Program>; Update: Partial<Program> }
      attendance: { Row: Attendance; Insert: Partial<Attendance>; Update: Partial<Attendance> }
    }
  }
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'operator'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Cluster {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  name: string
  cluster_id: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  cluster?: Cluster
}

export interface Committee {
  id: string
  name: string
  level: 'zone' | 'cluster' | 'unit'
  cluster_id: string | null
  unit_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  cluster?: Cluster
  unit?: Unit
}

export interface Position {
  id: string
  title: string
  committee_id: string
  points: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  committee?: Committee
}

export interface Member {
  id: string
  full_name: string
  mobile: string
  membership_number: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  positions?: MemberPositionFull[]
}

export interface MemberPosition {
  id: string
  member_id: string
  position_id: string
  committee_id: string
  cluster_id: string | null
  unit_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemberPositionFull extends MemberPosition {
  position: Position
  committee: Committee
  cluster?: Cluster
  unit?: Unit
  member?: Member
}

export interface SubWing {
  id: string
  name: string
  chairperson_name: string
  mobile: string | null
  membership_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AttendanceOperator {
  id: string
  profile_id: string | null
  full_name: string
  mobile: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Program {
  id: string
  name: string
  description: string | null
  venue: string
  program_date: string
  start_time: string | null
  status: 'upcoming' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  started_by: string | null
  closed_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  program_id: string
  member_id: string
  marked_by: string | null
  operator_id: string | null
  marked_at: string
  notes: string | null
  member?: Member
  operator?: AttendanceOperator
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}
