// Tipos del frontend alineados con los esquemas (Pydantic) del backend.

export interface Student {
  id: number
  dni: string
  name: string
  email?: string | null
  target_hours_daily: number
}

export type SessionStatus = 'pending' | 'in_progress' | 'completed'

export interface StudySession {
  id: number
  student_id: number
  course_name: string
  day_of_week: number // 0=Lunes ... 6=Domingo
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  duration_minutes: number
  status: SessionStatus
  started_at?: string | null
  finished_at?: string | null
  actual_duration_minutes?: number | null
  note?: string | null
}

export type AlertType = 'session_not_started' | 'daily_noncompliance'

export interface Alert {
  id: number
  student_id: number
  type: AlertType
  message: string
  related_session_id?: number | null
  created_at: string
  is_read: boolean
}

// ---------------------------------------------------------------------------
// Motor de IA (engine / entrega_modelos_semanales)
// ---------------------------------------------------------------------------

export type RiskLevel = 'bajo' | 'medio' | 'alto'

export interface RiskMetrics {
  compliance_today: number
  noncompliance_alerts: number
  not_started_alerts: number
  total_alerts: number
  target_hours_daily: number
}

export interface RiskAssessment {
  student_id: number
  week: number
  risk_score: number
  risk_level: RiskLevel
  macroprofiles: string[]
  macroprofiles_es: string[]
  interventions: string[]
  support_roles: string[]
  metrics: RiskMetrics
}

export interface SimulationWeek {
  week: number
  externality: string | null
  macroprofiles: string[]
  macroprofiles_es: string[]
  available_hours: number
  lost_hours: number
  recovery_hours: number
  alert: boolean
  risk: number
  interventions: string[]
  interventions_es: string[]
  support_roles: string[]
  plan_action: string
}

// ---------------------------------------------------------------------------
// Panel del docente
// ---------------------------------------------------------------------------

export interface StudentSummary {
  id: number
  dni: string
  name: string
  semester_label: string
  scheduled_sessions: number
  completed_sessions: number
  pending_sessions: number
  compliance_pct: number
  total_alerts: number
  unread_alerts: number
  risk_level: 'bajo' | 'medio' | 'alto'
}

export interface DayActivity {
  date: string
  completed: number
  pending: number
  alerts: number
}

export interface CourseDistribution {
  course_name: string
  total_sessions: number
  completed: number
  compliance_pct: number
}

export interface TeacherDashboard {
  date_from: string
  date_to: string
  total_students: number
  avg_compliance: number
  high_risk_count: number
  students: StudentSummary[]
  daily_activity: DayActivity[]
  course_distribution: CourseDistribution[]
}

export interface Dashboard {
  student: Student
  date: string
  scheduled_hours: number
  completed_hours: number
  compliance_percentage: number
  next_session: StudySession | null
  today_plan: StudySession[]
  pending_alerts: Alert[]
}

export interface SessionAction {
  session: StudySession
  message: string
}
