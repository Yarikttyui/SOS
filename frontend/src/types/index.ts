export type UserRole = 'citizen' | 'rescuer' | 'operator' | 'coordinator' | 'admin'

export type RescuerSpecialization = 
  | 'firefighter'
  | 'paramedic'
  | 'police'
  | 'water_rescue'
  | 'mountain_rescue'
  | 'search_rescue'
  | 'technical_rescue'
  | 'ecological'

export interface User {
  id: string
  email: string
  phone?: string
  full_name?: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  specialization?: RescuerSpecialization
  team_id?: string
  is_team_leader: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  phone?: string
  full_name?: string
  role?: UserRole
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user?: User
}

export type EmergencyType = 
  | 'fire'
  | 'medical'
  | 'police'
  | 'water_rescue'
  | 'mountain_rescue'
  | 'search_rescue'
  | 'ecological'
  | 'general'

export type AlertStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface SOSAlert {
  id: string
  user_id: string
  type: EmergencyType
  status: AlertStatus
  priority: number
  latitude: number
  longitude: number
  address?: string
  title?: string
  description?: string
  media_urls?: string[]
  ai_analysis?: any
  assigned_to?: string
  team_id?: string
  assigned_to_name?: string  // Имя спасателя
  team_name?: string  // Название бригады
  created_at: string
  updated_at: string
  assigned_at?: string
  completed_at?: string
}

export interface CreateSOSAlert {
  type: EmergencyType
  latitude: number
  longitude: number
  title?: string
  description?: string
  address?: string
  media_urls?: string[]
}

export type TeamType = 
  | 'fire'
  | 'medical'
  | 'police'
  | 'water_rescue'
  | 'mountain_rescue'
  | 'search_rescue'
  | 'ecological'
  | 'multi_purpose'

export type TeamStatus = 'available' | 'busy' | 'offline'

export interface RescueTeam {
  id: string
  name: string
  type: TeamType
  status: TeamStatus
  current_latitude?: number
  current_longitude?: number
  members?: any[]
  equipment?: any[]
  base_latitude?: number
  base_longitude?: number
  base_address?: string
  capacity?: string
  specialization?: string[]
  leader_id?: string
  leader_name?: string
  member_count?: number
  contact_phone?: string
  contact_email?: string
  created_at: string
  updated_at: string
}

export interface CreateTeamRequest {
  name: string
  type: TeamType
  member_ids?: string[]
  leader_id?: string
  contact_phone?: string
  contact_email?: string
  base_address?: string
  capacity?: string
  specialization?: string[]
}

export type NotificationType = 
  | 'sos_created'
  | 'sos_assigned'
  | 'sos_updated'
  | 'sos_completed'
  | 'team_assigned'
  | 'system'
  | 'warning'
  | 'info'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  alert_id?: string
  team_id?: string
  created_at: string
  read_at?: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationInfo extends Coordinates {
  address?: string
  accuracy?: number
}

export interface DashboardStats {
  total_alerts: number
  active_alerts: number
  today_alerts: number
  by_status: Record<AlertStatus, number>
  by_type: Record<EmergencyType, number>
}
