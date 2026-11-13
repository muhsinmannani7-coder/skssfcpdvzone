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
      videos: { Row: Video; Insert: Partial<Video>; Update: Partial<Video> }
      video_likes: { Row: VideoLike; Insert: Partial<VideoLike>; Update: Partial<VideoLike> }
      video_comments: { Row: VideoComment; Insert: Partial<VideoComment>; Update: Partial<VideoComment> }
      branch_scores: { Row: BranchScore; Insert: Partial<BranchScore>; Update: Partial<BranchScore> }
      branch_profiles: { Row: BranchProfile; Insert: Partial<BranchProfile>; Update: Partial<BranchProfile> }
      events: { Row: EventItem; Insert: Partial<EventItem>; Update: Partial<EventItem> }
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> }
      ulama_directory: { Row: UlamaItem; Insert: Partial<UlamaItem>; Update: Partial<UlamaItem> }
      doctors_directory: { Row: DoctorItem; Insert: Partial<DoctorItem>; Update: Partial<DoctorItem> }
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

export interface Video {
  id: string
  title: string
  description: string | null
  youtube_url: string
  youtube_video_id: string
  thumbnail_url: string | null
  duration: string | null
  category: string
  is_featured: boolean
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface VideoLike {
  id: string
  video_id: string
  user_identifier: string
  created_at: string
}

export interface VideoComment {
  id: string
  video_id: string
  author_name: string
  content: string
  is_approved: boolean
  created_at: string
}

export type ScoreCategory =
  | 'MASIRA'
  | 'KHUTBIYYATH'
  | 'HIDAYA'
  | 'EDU VISION'
  | 'RAHMA BLOOD BANK'
  | 'SAHACHARI CONNECT'
  | 'ULAMA-UMARA SANGAMAM'

export const SCORE_CATEGORY_MAX_MARKS: Record<ScoreCategory, number> = {
  'MASIRA': 10,
  'KHUTBIYYATH': 12,
  'HIDAYA': 15,
  'EDU VISION': 12,
  'RAHMA BLOOD BANK': 12,
  'SAHACHARI CONNECT': 22,
  'ULAMA-UMARA SANGAMAM': 17,
}

export interface BranchScore {
  id: string
  unit_id: string
  category: ScoreCategory
  marks: number
  max_marks: number
  notes: string | null
  is_published: boolean
  evaluated_by: string | null
  created_at: string
  updated_at: string
  unit?: Unit
}

export interface CommitteeMemberItem {
  id?: string
  name: string
  position: string
  mobile?: string
}

export interface BranchProfile {
  id: string
  unit_id: string
  name_ml?: string | null
  name_en?: string | null
  location?: string | null
  president_name: string | null
  president_mobile: string | null
  secretary_name: string | null
  secretary_mobile: string | null
  treasurer_name: string | null
  treasurer_mobile: string | null
  working_sec_name?: string | null
  working_sec_mobile?: string | null
  mahallu_name?: string | null
  mahallu_president_name?: string | null
  mahallu_president_mobile?: string | null
  mahallu_secretary_name?: string | null
  mahallu_secretary_mobile?: string | null
  masjid_details?: string | null
  other_office_bearers?: string | null
  committee_members_list?: CommitteeMemberItem[] | null
  total_members?: number | null
  active_workers?: number | null
  meeting_details?: string | null
  organizational_activities?: string | null
  educational_activities?: string | null
  social_service_activities?: string | null
  photos?: string[] | null
  documents?: string[] | null
  profile_status?: 'draft' | 'submitted' | 'approved'
  submitted_at?: string | null
  approved_at?: string | null
  address: string | null
  photo_url: string | null
  notes: string | null
  updated_at: string
  unit?: Unit
}

export interface SecretaryAccount {
  id: string
  unit_id: string
  name: string
  mobile: string
  password_hash: string
  must_change_password: boolean
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  unit?: Unit
}

export interface BranchActivity {
  id: string
  unit_id: string
  title: string
  category: 'organizational' | 'educational' | 'social' | 'meeting'
  activity_date: string
  description: string
  participants_count: number
  photos?: string[] | null
  status: 'draft' | 'pending' | 'approved' | 'published'
  created_by_secretary_id?: string | null
  created_at: string
  unit?: Unit
}

export interface AppNotification {
  id: string
  title: string
  message: string
  target_role: 'all' | 'admin' | 'secretary'
  unit_id?: string | null
  is_read: boolean
  created_at: string
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  venue: string | null
  event_date: string
  event_time: string | null
  program_type: string
  banner_url: string | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_published: boolean
  published_at: string
  created_at: string
}

export interface UlamaItem {
  id: string
  name: string
  title: string | null
  mahallu: string | null
  mobile: string | null
  address: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface DoctorItem {
  id: string
  name: string
  specialization: string | null
  hospital: string | null
  mobile: string | null
  address: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}
