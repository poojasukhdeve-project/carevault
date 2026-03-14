import { supabase } from './supabase'
import type { 
  User,
  CareRecipient,
  MedicalRecord,
  Appointment,
  DocumentRecord,
  EmergencyContact
} from '@/types/supabase'

// ===================================================================
// User Services
// ===================================================================

export const userService = {
  async getUser(uid: string): Promise<User | null> {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single()
    return error ? null : data
  },

  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    if (!supabase) return
    await supabase
      .from('users')
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq('id', uid)
  }
}

// ===================================================================
// Care Recipients Services
// ===================================================================

export const careRecipientService = {
  // Get all care recipients for a caregiver
  async getCareRecipientsByCaregiver(caregiverId: string): Promise<CareRecipient[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  // Get care recipient by patient email (for patient users)
  async getCareRecipientByEmail(patientEmail: string): Promise<CareRecipient | null> {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('patient_email', patientEmail)
      .eq('is_active', true)
      .single()
    return error ? null : data
  },

  // Get single care recipient by id
  async getCareRecipient(id: string): Promise<CareRecipient | null> {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('id', id)
      .single()
    return error ? null : data
  },

  // Create care recipient (caregiver only)
  async createCareRecipient(careRecipient: Omit<CareRecipient, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('care_recipients')
      .insert({
        ...careRecipient,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data.id
  },

  // Update care recipient (caregiver only)
  async updateCareRecipient(id: string, careRecipient: Partial<CareRecipient>): Promise<void> {
    if (!supabase) return
    await supabase
      .from('care_recipients')
      .update({ ...careRecipient, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  // Delete care recipient (caregiver only)
  async deleteCareRecipient(id: string): Promise<void> {
    if (!supabase) return
    await supabase
      .from('care_recipients')
      .delete()
      .eq('id', id)
  }
}

// ===================================================================
// Medical Records Services
// ===================================================================

export const medicalRecordService = {
  // Get all medical records for a care recipient
  async getMedicalRecords(careRecipientId: string): Promise<MedicalRecord[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('date', { ascending: false })
    return error ? [] : data
  },

  // Get medical records by type
  async getMedicalRecordsByType(careRecipientId: string, type: string): Promise<MedicalRecord[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .eq('type', type)
      .order('date', { ascending: false })
    return error ? [] : data
  },

  // Get active medications
  async getActiveMedications(careRecipientId: string): Promise<MedicalRecord[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .eq('type', 'medication')
      .eq('is_active', true)
      .order('date', { ascending: false })
    return error ? [] : data
  },

  // Create medical record (caregiver only)
  async createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data.id
  },

  // Update medical record (caregiver only)
  async updateMedicalRecord(id: string, record: Partial<MedicalRecord>): Promise<void> {
    if (!supabase) return
    await supabase
      .from('medical_records')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  // Delete medical record (caregiver only)
  async deleteMedicalRecord(id: string): Promise<void> {
    if (!supabase) return
    await supabase
      .from('medical_records')
      .delete()
      .eq('id', id)
  }
}

// ===================================================================
// Appointment Services
// ===================================================================

export const appointmentService = {
  // Get all appointments (for calendar view)
  async getAllAppointments(): Promise<Appointment[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
    return error ? [] : data
  },

  // Get all appointments for a care recipient
  async getAppointments(careRecipientId: string): Promise<Appointment[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('appointment_date', { ascending: true })
    return error ? [] : data
  },

  // Get upcoming appointments
  async getUpcomingAppointments(careRecipientId: string): Promise<Appointment[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .gte('appointment_date', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('appointment_date', { ascending: true })
    return error ? [] : data
  },

  // Create appointment (caregiver only)
  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data.id
  },

  // Update appointment (caregiver only)
  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<void> {
    if (!supabase) return
    await supabase
      .from('appointments')
      .update({ ...appointment, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  // Delete appointment (caregiver only)
  async deleteAppointment(id: string): Promise<void> {
    if (!supabase) return
    await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
  }
}

// ===================================================================
// Document Services
// ===================================================================

export const documentService = {
  // Get all documents for a care recipient
  async getDocuments(careRecipientId: string): Promise<DocumentRecord[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  // Get documents by category
  async getDocumentsByCategory(careRecipientId: string, category: string): Promise<DocumentRecord[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .eq('category', category)
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  // Upload document (caregiver only)
  async uploadDocument(
    file: File,
    careRecipientId: string,
    metadata: Omit<DocumentRecord, 'id' | 'care_recipient_id' | 'file_url' | 'file_name' | 'file_size' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Save metadata to database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...metadata,
        care_recipient_id: careRecipientId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  },

  // Delete document (caregiver only)
  async deleteDocument(id: string, fileUrl: string): Promise<void> {
    if (!supabase) return
    
    // Extract file path from URL
    const urlParts = fileUrl.split('/documents/')
    if (urlParts.length === 2) {
      const filePath = `documents/${urlParts[1]}`
      
      // Delete from Storage
      await supabase.storage
        .from('documents')
        .remove([filePath])
    }

    // Delete from database
    await supabase
      .from('documents')
      .delete()
      .eq('id', id)
  }
}

// ===================================================================
// Emergency Contact Services
// ===================================================================

export const emergencyContactService = {
  // Get all emergency contacts for a care recipient
  async getEmergencyContacts(careRecipientId: string): Promise<EmergencyContact[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })
    return error ? [] : data
  },

  // Create emergency contact (caregiver only)
  async createEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data.id
  },

  // Update emergency contact (caregiver only)
  async updateEmergencyContact(id: string, contact: Partial<EmergencyContact>): Promise<void> {
    if (!supabase) return
    await supabase
      .from('emergency_contacts')
      .update({ ...contact, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  // Delete emergency contact (caregiver only)
  async deleteEmergencyContact(id: string): Promise<void> {
    if (!supabase) return
    await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
  }
}

// Legacy exports for backward compatibility
export const patientService = careRecipientService
export const medicationService = medicalRecordService
export const careLogService = medicalRecordService
