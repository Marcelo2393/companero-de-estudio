import axios from 'axios'

import type { Alert, Dashboard, RiskAssessment, SessionAction, SimulationWeek, Student, StudySession, TeacherDashboard } from '../types'

// El baseURL "/api" se redirige al backend FastAPI mediante el proxy de Vite.
const api = axios.create({ baseURL: '/api' })

export async function login(dni: string): Promise<Student> {
  const { data } = await api.post<Student>('/students/login', { dni })
  return data
}

export async function getStudent(studentId: number): Promise<Student> {
  const { data } = await api.get<Student>(`/students/${studentId}`)
  return data
}

export async function getDashboard(studentId: number): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>(`/students/${studentId}/dashboard`)
  return data
}

export async function getWeeklyPlan(studentId: number): Promise<StudySession[]> {
  const { data } = await api.get<StudySession[]>(`/study-plans/${studentId}`)
  return data
}

export async function getTodayPlan(studentId: number): Promise<StudySession[]> {
  const { data } = await api.get<StudySession[]>(`/study-plans/${studentId}/today`)
  return data
}

export async function startSession(sessionId: number): Promise<SessionAction> {
  const { data } = await api.post<SessionAction>(`/study-plans/sessions/${sessionId}/start`)
  return data
}

export async function finishSession(sessionId: number, note?: string): Promise<SessionAction> {
  const { data } = await api.post<SessionAction>(
    `/study-plans/sessions/${sessionId}/finish`,
    { note: note ?? '' }
  )
  return data
}

export async function getAlerts(studentId: number): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>(`/alerts/${studentId}`)
  return data
}

export async function checkAlerts(studentId: number): Promise<Alert[]> {
  const { data } = await api.post<Alert[]>(`/alerts/${studentId}/check`)
  return data
}

export async function markAlertRead(alertId: number): Promise<Alert> {
  const { data } = await api.patch<Alert>(`/alerts/${alertId}/read`)
  return data
}

// ---------------------------------------------------------------------------
// Motor de IA — engine / entrega_modelos_semanales
// ---------------------------------------------------------------------------

export async function getRiskAssessment(studentId: number): Promise<RiskAssessment> {
  const { data } = await api.get<RiskAssessment>(`/risk/${studentId}`)
  return data
}

export async function runSimulation(
  events?: Record<string, string>,
  weeks = 9,
  baseHours = 10.0
): Promise<SimulationWeek[]> {
  const { data } = await api.post<SimulationWeek[]>('/risk/simulate', {
    events: events ?? null,
    weeks,
    base_hours: baseHours,
  })
  return data
}

export async function getExternalities(): Promise<Record<string, string>> {
  const { data } = await api.get<Record<string, string>>('/risk/externalities/list')
  return data
}

// ---------------------------------------------------------------------------
// Panel del docente
// ---------------------------------------------------------------------------

export async function getTeacherDashboard(
  dateFrom?: string,
  dateTo?: string
): Promise<TeacherDashboard> {
  const params: Record<string, string> = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo)   params.date_to   = dateTo
  const { data } = await api.get<TeacherDashboard>('/teacher/dashboard', { params })
  return data
}
