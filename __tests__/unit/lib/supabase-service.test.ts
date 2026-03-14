// Mock chain helper that works with Supabase's chained API pattern
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

// Mock the supabase module
var mockFrom = jest.fn()
var mockStorageFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  },
}))

import {
  userService,
  careRecipientService,
  medicalRecordService,
  appointmentService,
  documentService,
  emergencyContactService,
} from '@/lib/supabase-service'

function setupMock(result: { data: unknown; error: unknown }) {
  const chain = createChain(result)
  mockFrom.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ====================== userService ======================

describe('userService', () => {
  test('getUser returns user data on success', async () => {
    const mockUser = { id: 'uid-1', email: 'test@test.com', role: 'caregiver' }
    setupMock({ data: mockUser, error: null })

    const result = await userService.getUser('uid-1')
    expect(result).toEqual(mockUser)
    expect(mockFrom).toHaveBeenCalledWith('users')
  })

  test('getUser returns null on error', async () => {
    setupMock({ data: null, error: { message: 'not found' } })

    const result = await userService.getUser('uid-bad')
    expect(result).toBeNull()
  })

  test('updateUser calls from(users)', async () => {
    setupMock({ data: null, error: null })

    await userService.updateUser('uid-1', { full_name: 'New Name' } as any)
    expect(mockFrom).toHaveBeenCalledWith('users')
  })
})

// ====================== careRecipientService ======================

describe('careRecipientService', () => {
  test('getCareRecipientsByCaregiver returns array on success', async () => {
    const mockData = [{ id: 'cr-1', first_name: 'John' }]
    setupMock({ data: mockData, error: null })

    const result = await careRecipientService.getCareRecipientsByCaregiver('cg-1')
    expect(result).toEqual(mockData)
  })

  test('getCareRecipientsByCaregiver returns [] on error', async () => {
    setupMock({ data: null, error: { message: 'fail' } })

    const result = await careRecipientService.getCareRecipientsByCaregiver('cg-bad')
    expect(result).toEqual([])
  })

  test('getCareRecipientByEmail returns data on success', async () => {
    const mockData = { id: 'cr-1', patient_email: 'p@test.com' }
    setupMock({ data: mockData, error: null })

    const result = await careRecipientService.getCareRecipientByEmail('p@test.com')
    expect(result).toEqual(mockData)
  })

  test('getCareRecipientByEmail returns null on error', async () => {
    setupMock({ data: null, error: { message: 'not found' } })

    const result = await careRecipientService.getCareRecipientByEmail('bad@test.com')
    expect(result).toBeNull()
  })

  test('getCareRecipient returns data by id', async () => {
    const mockData = { id: 'cr-1' }
    setupMock({ data: mockData, error: null })

    const result = await careRecipientService.getCareRecipient('cr-1')
    expect(result).toEqual(mockData)
  })

  test('createCareRecipient returns new id on success', async () => {
    setupMock({ data: { id: 'cr-new' }, error: null })

    const result = await careRecipientService.createCareRecipient({
      caregiver_id: 'cg-1', first_name: 'New', last_name: 'Patient',
      date_of_birth: '2000-01-01', is_active: true,
    } as any)
    expect(result).toBe('cr-new')
  })

  test('createCareRecipient throws on error', async () => {
    const err = { message: 'insert failed' }
    setupMock({ data: null, error: err })

    await expect(
      careRecipientService.createCareRecipient({ caregiver_id: 'cg-1', first_name: 'Fail' } as any)
    ).rejects.toEqual(err)
  })

  test('updateCareRecipient calls from(care_recipients)', async () => {
    setupMock({ data: null, error: null })
    await careRecipientService.updateCareRecipient('cr-1', { first_name: 'Updated' })
    expect(mockFrom).toHaveBeenCalledWith('care_recipients')
  })

  test('deleteCareRecipient calls from(care_recipients)', async () => {
    setupMock({ data: null, error: null })
    await careRecipientService.deleteCareRecipient('cr-1')
    expect(mockFrom).toHaveBeenCalledWith('care_recipients')
  })
})

// ====================== medicalRecordService ======================

describe('medicalRecordService', () => {
  test('getMedicalRecords returns records on success', async () => {
    const mockData = [{ id: 'mr-1', type: 'medication' }]
    setupMock({ data: mockData, error: null })

    const result = await medicalRecordService.getMedicalRecords('cr-1')
    expect(result).toEqual(mockData)
  })

  test('getMedicalRecords returns [] on error', async () => {
    setupMock({ data: null, error: { message: 'fail' } })
    const result = await medicalRecordService.getMedicalRecords('cr-bad')
    expect(result).toEqual([])
  })

  test('getMedicalRecordsByType returns filtered records', async () => {
    const mockData = [{ id: 'mr-1', type: 'medication' }]
    setupMock({ data: mockData, error: null })

    const result = await medicalRecordService.getMedicalRecordsByType('cr-1', 'medication')
    expect(result).toEqual(mockData)
  })

  test('getActiveMedications returns active medications', async () => {
    const mockData = [{ id: 'mr-1', type: 'medication', is_active: true }]
    setupMock({ data: mockData, error: null })

    const result = await medicalRecordService.getActiveMedications('cr-1')
    expect(result).toEqual(mockData)
  })

  test('createMedicalRecord returns new id on success', async () => {
    setupMock({ data: { id: 'mr-new' }, error: null })

    const result = await medicalRecordService.createMedicalRecord({
      care_recipient_id: 'cr-1', type: 'medication', title: 'Test Med', date: '2024-01-01',
    } as any)
    expect(result).toBe('mr-new')
  })

  test('createMedicalRecord throws on error', async () => {
    const err = { message: 'insert failed' }
    setupMock({ data: null, error: err })

    await expect(
      medicalRecordService.createMedicalRecord({ type: 'medication' } as any)
    ).rejects.toEqual(err)
  })

  test('updateMedicalRecord calls from(medical_records)', async () => {
    setupMock({ data: null, error: null })
    await medicalRecordService.updateMedicalRecord('mr-1', { title: 'Updated' })
    expect(mockFrom).toHaveBeenCalledWith('medical_records')
  })

  test('deleteMedicalRecord calls from(medical_records)', async () => {
    setupMock({ data: null, error: null })
    await medicalRecordService.deleteMedicalRecord('mr-1')
    expect(mockFrom).toHaveBeenCalledWith('medical_records')
  })
})

// ====================== appointmentService ======================

describe('appointmentService', () => {
  test('getAllAppointments returns all', async () => {
    const mockData = [{ id: 'apt-1' }]
    setupMock({ data: mockData, error: null })

    const result = await appointmentService.getAllAppointments()
    expect(result).toEqual(mockData)
  })

  test('getAllAppointments returns [] on error', async () => {
    setupMock({ data: null, error: { message: 'fail' } })
    const result = await appointmentService.getAllAppointments()
    expect(result).toEqual([])
  })

  test('getAppointments returns for care recipient', async () => {
    const mockData = [{ id: 'apt-1' }]
    setupMock({ data: mockData, error: null })

    const result = await appointmentService.getAppointments('cr-1')
    expect(result).toEqual(mockData)
  })

  test('getUpcomingAppointments returns upcoming', async () => {
    const mockData = [{ id: 'apt-1', status: 'scheduled' }]
    setupMock({ data: mockData, error: null })

    const result = await appointmentService.getUpcomingAppointments('cr-1')
    expect(result).toEqual(mockData)
  })

  test('createAppointment returns new id', async () => {
    setupMock({ data: { id: 'apt-new' }, error: null })

    const result = await appointmentService.createAppointment({
      care_recipient_id: 'cr-1', title: 'Test', appointment_date: '2024-06-01', status: 'scheduled',
    } as any)
    expect(result).toBe('apt-new')
  })

  test('createAppointment throws on error', async () => {
    const err = { message: 'insert failed' }
    setupMock({ data: null, error: err })

    await expect(
      appointmentService.createAppointment({ title: 'Fail' } as any)
    ).rejects.toEqual(err)
  })

  test('updateAppointment calls from(appointments)', async () => {
    setupMock({ data: null, error: null })
    await appointmentService.updateAppointment('apt-1', { status: 'completed' })
    expect(mockFrom).toHaveBeenCalledWith('appointments')
  })

  test('deleteAppointment calls from(appointments)', async () => {
    setupMock({ data: null, error: null })
    await appointmentService.deleteAppointment('apt-1')
    expect(mockFrom).toHaveBeenCalledWith('appointments')
  })
})

// ====================== emergencyContactService ======================

describe('emergencyContactService', () => {
  test('getEmergencyContacts returns contacts on success', async () => {
    const mockData = [{ id: 'ec-1', name: 'Contact 1' }]
    setupMock({ data: mockData, error: null })

    const result = await emergencyContactService.getEmergencyContacts('cr-1')
    expect(result).toEqual(mockData)
  })

  test('getEmergencyContacts returns [] on error', async () => {
    setupMock({ data: null, error: { message: 'fail' } })
    const result = await emergencyContactService.getEmergencyContacts('cr-bad')
    expect(result).toEqual([])
  })

  test('createEmergencyContact returns new id', async () => {
    setupMock({ data: { id: 'ec-new' }, error: null })

    const result = await emergencyContactService.createEmergencyContact({
      care_recipient_id: 'cr-1', name: 'Emergency Person', phone: '555-1234',
      relationship: 'Spouse', is_primary: true,
    } as any)
    expect(result).toBe('ec-new')
  })

  test('createEmergencyContact throws on error', async () => {
    const err = { message: 'insert failed' }
    setupMock({ data: null, error: err })

    await expect(
      emergencyContactService.createEmergencyContact({ name: 'Fail' } as any)
    ).rejects.toEqual(err)
  })

  test('updateEmergencyContact calls from(emergency_contacts)', async () => {
    setupMock({ data: null, error: null })
    await emergencyContactService.updateEmergencyContact('ec-1', { name: 'Updated' })
    expect(mockFrom).toHaveBeenCalledWith('emergency_contacts')
  })

  test('deleteEmergencyContact calls from(emergency_contacts)', async () => {
    setupMock({ data: null, error: null })
    await emergencyContactService.deleteEmergencyContact('ec-1')
    expect(mockFrom).toHaveBeenCalledWith('emergency_contacts')
  })
})

// ====================== documentService ======================

describe('documentService', () => {
  test('getDocuments returns documents on success', async () => {
    const mockData = [{ id: 'doc-1', file_name: 'test.pdf' }]
    setupMock({ data: mockData, error: null })

    const result = await documentService.getDocuments('cr-1')
    expect(result).toEqual(mockData)
  })

  test('getDocuments returns [] on error', async () => {
    setupMock({ data: null, error: { message: 'fail' } })
    const result = await documentService.getDocuments('cr-bad')
    expect(result).toEqual([])
  })

  test('getDocumentsByCategory returns filtered documents', async () => {
    const mockData = [{ id: 'doc-1', category: 'lab_results' }]
    setupMock({ data: mockData, error: null })

    const result = await documentService.getDocumentsByCategory('cr-1', 'lab_results')
    expect(result).toEqual(mockData)
  })

  test('deleteDocument deletes from storage and database', async () => {
    const mockRemove = jest.fn().mockResolvedValue({ error: null })
    mockStorageFrom.mockReturnValue({ remove: mockRemove })
    setupMock({ data: null, error: null })

    await documentService.deleteDocument('doc-1', 'https://example.com/storage/documents/test.pdf')
    expect(mockStorageFrom).toHaveBeenCalledWith('documents')
    expect(mockFrom).toHaveBeenCalledWith('documents')
  })

  test('deleteDocument handles URL without /documents/ path', async () => {
    setupMock({ data: null, error: null })

    await documentService.deleteDocument('doc-1', 'https://example.com/other-path')
    expect(mockFrom).toHaveBeenCalledWith('documents')
  })
})
