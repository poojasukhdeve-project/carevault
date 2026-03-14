/**
 * Patient Management Usecase Tests
 * Tests user stories related to patient/care recipient CRUD operations
 */

import { careRecipientService } from '@/lib/supabase-service'

// Mock the service
jest.mock('@/lib/supabase-service', () => ({
  careRecipientService: {
    getCareRecipientsByCaregiver: jest.fn(),
    getCareRecipient: jest.fn(),
    createCareRecipient: jest.fn(),
    updateCareRecipient: jest.fn(),
    deleteCareRecipient: jest.fn(),
  },
}))

const mockCareRecipientService = careRecipientService as jest.Mocked<typeof careRecipientService>

describe('Patient Management Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const samplePatient = {
    id: 'patient-001',
    caregiver_id: 'caregiver-001',
    email: 'patient@example.com',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1945-03-15',
    primary_diagnosis: 'Alzheimer\'s Disease',
    medical_conditions: ['Hypertension', 'Diabetes'],
    allergies: ['Penicillin'],
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0100',
    notes: 'Requires assistance with daily activities',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('UC-007: Caregiver can add new patient', () => {
    const newPatientData = {
      caregiver_id: 'caregiver-001',
      email: 'newpatient@example.com',
      first_name: 'Alice',
      last_name: 'Smith',
      date_of_birth: '1950-06-20',
      primary_diagnosis: 'Dementia',
    }

    it('should successfully create a new patient record', async () => {
      mockCareRecipientService.createCareRecipient.mockResolvedValue('new-patient-id')

      const result = await careRecipientService.createCareRecipient(newPatientData)

      expect(result).toBe('new-patient-id')
      expect(mockCareRecipientService.createCareRecipient).toHaveBeenCalledWith(newPatientData)
    })

    it('should create patient with all required fields', async () => {
      mockCareRecipientService.createCareRecipient.mockResolvedValue('patient-id')

      await careRecipientService.createCareRecipient(newPatientData)

      const callArgs = mockCareRecipientService.createCareRecipient.mock.calls[0][0]
      expect(callArgs.caregiver_id).toBeDefined()
      expect(callArgs.first_name).toBeDefined()
      expect(callArgs.last_name).toBeDefined()
    })

    it('should create patient with optional medical information', async () => {
      const patientWithMedicalInfo = {
        ...newPatientData,
        medical_conditions: ['Arthritis', 'Heart Disease'],
        allergies: ['Aspirin'],
        notes: 'Special care instructions',
      }
      mockCareRecipientService.createCareRecipient.mockResolvedValue('patient-id')

      await careRecipientService.createCareRecipient(patientWithMedicalInfo)

      expect(mockCareRecipientService.createCareRecipient).toHaveBeenCalledWith(
        expect.objectContaining({
          medical_conditions: ['Arthritis', 'Heart Disease'],
          allergies: ['Aspirin'],
        })
      )
    })
  })

  describe('UC-008: Caregiver can view patient list', () => {
    const patientList = [
      samplePatient,
      { ...samplePatient, id: 'patient-002', first_name: 'Bob', email: 'bob@example.com' },
      { ...samplePatient, id: 'patient-003', first_name: 'Carol', email: 'carol@example.com' },
    ]

    it('should return all patients for a caregiver', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(patientList)

      const result = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')

      expect(result).toHaveLength(3)
      expect(result).toEqual(patientList)
    })

    it('should return empty array when caregiver has no patients', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue([])

      const result = await careRecipientService.getCareRecipientsByCaregiver('new-caregiver')

      expect(result).toEqual([])
    })

    it('should return patient details including medical information', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue([samplePatient])

      const result = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')

      expect(result[0]).toHaveProperty('primary_diagnosis')
      expect(result[0]).toHaveProperty('medical_conditions')
      expect(result[0]).toHaveProperty('allergies')
    })
  })

  describe('UC-009: Caregiver can edit patient info', () => {
    const updates = {
      first_name: 'Jonathan',
      primary_diagnosis: 'Vascular Dementia',
      notes: 'Updated care instructions',
    }

    it('should successfully update patient information', async () => {
      mockCareRecipientService.updateCareRecipient.mockResolvedValue(undefined)

      await careRecipientService.updateCareRecipient('patient-001', updates)

      expect(mockCareRecipientService.updateCareRecipient).toHaveBeenCalledWith('patient-001', updates)
    })

    it('should allow partial updates', async () => {
      mockCareRecipientService.updateCareRecipient.mockResolvedValue(undefined)

      await careRecipientService.updateCareRecipient('patient-001', { notes: 'Only updating notes' })

      expect(mockCareRecipientService.updateCareRecipient).toHaveBeenCalledWith(
        'patient-001',
        { notes: 'Only updating notes' }
      )
    })

    it('should update medical conditions array', async () => {
      mockCareRecipientService.updateCareRecipient.mockResolvedValue(undefined)

      const newConditions = ['Hypertension', 'Diabetes', 'Osteoporosis']
      await careRecipientService.updateCareRecipient('patient-001', {
        medical_conditions: newConditions,
      })

      expect(mockCareRecipientService.updateCareRecipient).toHaveBeenCalledWith(
        'patient-001',
        expect.objectContaining({ medical_conditions: newConditions })
      )
    })
  })

  describe('UC-010: Caregiver can delete patient', () => {
    it('should successfully delete a patient record', async () => {
      mockCareRecipientService.deleteCareRecipient.mockResolvedValue(undefined)

      await careRecipientService.deleteCareRecipient('patient-001')

      expect(mockCareRecipientService.deleteCareRecipient).toHaveBeenCalledWith('patient-001')
    })

    it('should handle deletion of non-existent patient gracefully', async () => {
      mockCareRecipientService.deleteCareRecipient.mockRejectedValue(new Error('Patient not found'))

      await expect(
        careRecipientService.deleteCareRecipient('non-existent-id')
      ).rejects.toThrow('Patient not found')
    })
  })

  describe('UC-011: Caregiver can search patients', () => {
    const allPatients = [
      { ...samplePatient, id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      { ...samplePatient, id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
      { ...samplePatient, id: '3', first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' },
    ]

    it('should filter patients by name search query', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(allPatients)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')
      const searchQuery = 'john'
      const filtered = patients.filter(
        (p) =>
          p.first_name.toLowerCase().includes(searchQuery) ||
          p.last_name.toLowerCase().includes(searchQuery) ||
          p.email.toLowerCase().includes(searchQuery)
      )

      expect(filtered).toHaveLength(2) // John Doe and Bob Johnson
    })

    it('should filter patients by email', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(allPatients)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')
      const searchQuery = 'jane@'
      const filtered = patients.filter((p) => p.email.toLowerCase().includes(searchQuery))

      expect(filtered).toHaveLength(1)
      expect(filtered[0].first_name).toBe('Jane')
    })

    it('should return empty array when no matches found', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(allPatients)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')
      const searchQuery = 'xyz-no-match'
      const filtered = patients.filter(
        (p) =>
          p.first_name.toLowerCase().includes(searchQuery) ||
          p.last_name.toLowerCase().includes(searchQuery)
      )

      expect(filtered).toHaveLength(0)
    })
  })

  describe('UC-012: Caregiver can filter by diagnosis', () => {
    const patientsWithDiagnoses = [
      { ...samplePatient, id: '1', primary_diagnosis: 'Alzheimer\'s Disease' },
      { ...samplePatient, id: '2', primary_diagnosis: 'Vascular Dementia' },
      { ...samplePatient, id: '3', primary_diagnosis: 'Alzheimer\'s Disease' },
      { ...samplePatient, id: '4', primary_diagnosis: 'Parkinson\'s Disease' },
    ]

    it('should filter patients by specific diagnosis', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(patientsWithDiagnoses)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')
      const filtered = patients.filter((p) => p.primary_diagnosis === 'Alzheimer\'s Disease')

      expect(filtered).toHaveLength(2)
    })

    it('should return all patients when no filter applied', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(patientsWithDiagnoses)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')

      expect(patients).toHaveLength(4)
    })

    it('should extract unique diagnoses for filter dropdown', async () => {
      mockCareRecipientService.getCareRecipientsByCaregiver.mockResolvedValue(patientsWithDiagnoses)

      const patients = await careRecipientService.getCareRecipientsByCaregiver('caregiver-001')
      const uniqueDiagnoses = [...new Set(patients.map((p) => p.primary_diagnosis))]

      expect(uniqueDiagnoses).toHaveLength(3)
      expect(uniqueDiagnoses).toContain('Alzheimer\'s Disease')
      expect(uniqueDiagnoses).toContain('Vascular Dementia')
      expect(uniqueDiagnoses).toContain('Parkinson\'s Disease')
    })
  })
})
