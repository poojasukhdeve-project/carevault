// Supabase types for care recipients architecture

export type UserRole = 'caregiver' | 'patient'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
export type DocumentCategory = 'medical' | 'insurance' | 'legal' | 'personal' | 'financial' | 'identification'
export type MedicalRecordType = 'medication' | 'condition' | 'procedure' | 'lab_result' | 'vital_sign'
export type MedicationFrequency = 'daily' | 'weekly' | 'monthly' | 'as_needed'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  pending_caregiver_email?: string
  pending_caregiver_name?: string
  created_at: string
  updated_at: string
}

export interface CareRecipient {
  id: string
  caregiver_id: string
  patient_email?: string
  first_name: string
  last_name: string
  date_of_birth: string
  diagnosis?: string
  medical_conditions?: string
  allergies?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  care_recipient_id: string
  type: MedicalRecordType
  title: string
  description?: string
  date: string
  medication_name?: string
  medication_dosage?: string
  medication_frequency?: MedicationFrequency
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  care_recipient_id: string
  title: string
  description?: string
  appointment_date: string
  location?: string
  doctor_name?: string
  status: AppointmentStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface DocumentRecord {
  id: string
  care_recipient_id: string
  name: string
  category: DocumentCategory
  file_url?: string
  file_name?: string
  file_size?: number
  description?: string
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  care_recipient_id: string
  name: string
  relationship?: string
  phone?: string
  email?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Legacy type aliases for backward compatibility
export type Patient = CareRecipient
export type Medication = MedicalRecord
export type CareLog = MedicalRecord
