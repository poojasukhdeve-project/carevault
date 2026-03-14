// Mock the supabase module
var mockFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import {
  careRecipientService,
  medicalRecordService,
  appointmentService,
  emergencyContactService,
  documentService,
} from '@/lib/supabase-service'

function createChain(result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    single: jest.fn(() => chain),
    order: jest.fn(() => chain),
    then: (resolve: (v: unknown) => void) => resolve(result),
  }
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================
// Combination: getMedicalRecordsByType
// Dimensions: careRecipientId x type
// ============================================================

describe('getMedicalRecordsByType combinations', () => {
  const careRecipientIds = ['valid-uuid-123', '']
  const recordTypes = ['medication', 'condition', 'procedure', 'lab_result', 'vital_sign']

  const combos: [string, string][] = []
  for (const id of careRecipientIds) {
    for (const type of recordTypes) {
      combos.push([id, type])
    }
  }

  test.each(combos)(
    'getMedicalRecordsByType(%s, %s) returns array',
    async (careRecipientId, type) => {
      const mockData = [{ id: 'mr-1', type }]
      mockFrom.mockReturnValue(createChain({ data: mockData, error: null }))

      const result = await medicalRecordService.getMedicalRecordsByType(careRecipientId, type)
      expect(Array.isArray(result)).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('medical_records')
    }
  )

  test.each(combos)(
    'getMedicalRecordsByType(%s, %s) returns [] on error',
    async (careRecipientId, type) => {
      mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'fail' } }))

      const result = await medicalRecordService.getMedicalRecordsByType(careRecipientId, type)
      expect(result).toEqual([])
    }
  )
})

// ============================================================
// Combination: CRUD operations across services
// Dimensions: service x operation x result (success/error)
// ============================================================

describe('CRUD operation combinations across services', () => {
  // Read operations (return array)
  const readArrayServices = [
    { name: 'careRecipientService.getCareRecipientsByCaregiver', fn: () => careRecipientService.getCareRecipientsByCaregiver('cg-1') },
    { name: 'medicalRecordService.getMedicalRecords', fn: () => medicalRecordService.getMedicalRecords('cr-1') },
    { name: 'appointmentService.getAllAppointments', fn: () => appointmentService.getAllAppointments() },
    { name: 'appointmentService.getAppointments', fn: () => appointmentService.getAppointments('cr-1') },
    { name: 'appointmentService.getUpcomingAppointments', fn: () => appointmentService.getUpcomingAppointments('cr-1') },
    { name: 'documentService.getDocuments', fn: () => documentService.getDocuments('cr-1') },
    { name: 'documentService.getDocumentsByCategory', fn: () => documentService.getDocumentsByCategory('cr-1', 'lab_results') },
    { name: 'emergencyContactService.getEmergencyContacts', fn: () => emergencyContactService.getEmergencyContacts('cr-1') },
  ]

  test.each(readArrayServices.map((s) => [s.name, s.fn] as [string, () => Promise<unknown[]>]))(
    '%s returns data array on success',
    async (_name, fn) => {
      const mockData = [{ id: 'test-1' }]
      mockFrom.mockReturnValue(createChain({ data: mockData, error: null }))

      const result = await fn()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(mockData)
    }
  )

  test.each(readArrayServices.map((s) => [s.name, s.fn] as [string, () => Promise<unknown[]>]))(
    '%s returns empty array on error',
    async (_name, fn) => {
      mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'error' } }))

      const result = await fn()
      expect(result).toEqual([])
    }
  )

  // Create operations (return id or throw)
  const createServices = [
    {
      name: 'careRecipientService.createCareRecipient',
      fn: () => careRecipientService.createCareRecipient({ caregiver_id: 'cg-1', first_name: 'T', last_name: 'T', date_of_birth: '2000-01-01', is_active: true } as any),
    },
    {
      name: 'medicalRecordService.createMedicalRecord',
      fn: () => medicalRecordService.createMedicalRecord({ care_recipient_id: 'cr-1', type: 'medication', title: 'T', date: '2024-01-01' } as any),
    },
    {
      name: 'appointmentService.createAppointment',
      fn: () => appointmentService.createAppointment({ care_recipient_id: 'cr-1', title: 'T', appointment_date: '2024-06-01', status: 'scheduled' } as any),
    },
    {
      name: 'emergencyContactService.createEmergencyContact',
      fn: () => emergencyContactService.createEmergencyContact({ care_recipient_id: 'cr-1', name: 'T', phone: '555', relationship: 'Spouse', is_primary: true } as any),
    },
  ]

  test.each(createServices.map((s) => [s.name, s.fn] as [string, () => Promise<string>]))(
    '%s returns id on success',
    async (_name, fn) => {
      mockFrom.mockReturnValue(createChain({ data: { id: 'new-id' }, error: null }))

      const result = await fn()
      expect(result).toBe('new-id')
    }
  )

  test.each(createServices.map((s) => [s.name, s.fn] as [string, () => Promise<string>]))(
    '%s throws on error',
    async (_name, fn) => {
      mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'fail' } }))

      await expect(fn()).rejects.toEqual({ message: 'fail' })
    }
  )

  // Delete operations (void, no throw)
  const deleteServices = [
    { name: 'careRecipientService.deleteCareRecipient', fn: () => careRecipientService.deleteCareRecipient('id-1') },
    { name: 'medicalRecordService.deleteMedicalRecord', fn: () => medicalRecordService.deleteMedicalRecord('id-1') },
    { name: 'appointmentService.deleteAppointment', fn: () => appointmentService.deleteAppointment('id-1') },
    { name: 'emergencyContactService.deleteEmergencyContact', fn: () => emergencyContactService.deleteEmergencyContact('id-1') },
  ]

  test.each(deleteServices.map((s) => [s.name, s.fn] as [string, () => Promise<void>]))(
    '%s completes without error',
    async (_name, fn) => {
      mockFrom.mockReturnValue(createChain({ data: null, error: null }))

      await expect(fn()).resolves.toBeUndefined()
    }
  )
})
