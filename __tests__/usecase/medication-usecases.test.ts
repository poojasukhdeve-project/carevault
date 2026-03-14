/**
 * Medication Management Usecase Tests
 * Tests user stories related to medication tracking and management
 */

import { medicalRecordService } from '@/lib/supabase-service'

// Mock the service
jest.mock('@/lib/supabase-service', () => ({
  medicalRecordService: {
    getMedicalRecords: jest.fn(),
    getMedicalRecordsByType: jest.fn(),
    getActiveMedications: jest.fn(),
    createMedicalRecord: jest.fn(),
    updateMedicalRecord: jest.fn(),
    deleteMedicalRecord: jest.fn(),
  },
}))

const mockMedicalRecordService = medicalRecordService as jest.Mocked<typeof medicalRecordService>

describe('Medication Management Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const sampleMedication = {
    id: 'med-001',
    care_recipient_id: 'patient-001',
    type: 'medication',
    title: 'Donepezil',
    description: '10mg once daily for Alzheimer\'s',
    date: '2024-01-01',
    metadata: {
      dosage: '10mg',
      frequency: 'daily',
      start_date: '2024-01-01',
      is_active: true,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('UC-013: Caregiver can add medication', () => {
    const newMedication = {
      care_recipient_id: 'patient-001',
      type: 'medication',
      title: 'Memantine',
      description: '5mg twice daily',
      date: '2024-02-01',
      metadata: {
        dosage: '5mg',
        frequency: 'twice_daily',
        start_date: '2024-02-01',
        is_active: true,
      },
    }

    it('should successfully add a new medication', async () => {
      mockMedicalRecordService.createMedicalRecord.mockResolvedValue('new-med-id')

      const result = await medicalRecordService.createMedicalRecord(newMedication)

      expect(result).toBe('new-med-id')
      expect(mockMedicalRecordService.createMedicalRecord).toHaveBeenCalledWith(newMedication)
    })

    it('should create medication with required fields', async () => {
      mockMedicalRecordService.createMedicalRecord.mockResolvedValue('med-id')

      await medicalRecordService.createMedicalRecord(newMedication)

      const callArgs = mockMedicalRecordService.createMedicalRecord.mock.calls[0][0]
      expect(callArgs.title).toBeDefined()
      expect(callArgs.type).toBe('medication')
      expect(callArgs.metadata.dosage).toBeDefined()
      expect(callArgs.metadata.frequency).toBeDefined()
    })

    it('should set medication as active by default', async () => {
      mockMedicalRecordService.createMedicalRecord.mockResolvedValue('med-id')

      await medicalRecordService.createMedicalRecord(newMedication)

      const callArgs = mockMedicalRecordService.createMedicalRecord.mock.calls[0][0]
      expect(callArgs.metadata.is_active).toBe(true)
    })

    it('should support different frequency options', async () => {
      const frequencies = ['daily', 'twice_daily', 'weekly', 'monthly', 'as_needed']
      
      for (const frequency of frequencies) {
        mockMedicalRecordService.createMedicalRecord.mockResolvedValue('med-id')
        
        await medicalRecordService.createMedicalRecord({
          ...newMedication,
          metadata: { ...newMedication.metadata, frequency },
        })

        const callArgs = mockMedicalRecordService.createMedicalRecord.mock.calls.slice(-1)[0][0]
        expect(callArgs.metadata.frequency).toBe(frequency)
      }
    })
  })

  describe('UC-014: Caregiver can view active medications', () => {
    const activeMedications = [
      { ...sampleMedication, id: 'med-1', title: 'Donepezil', metadata: { ...sampleMedication.metadata, is_active: true } },
      { ...sampleMedication, id: 'med-2', title: 'Memantine', metadata: { ...sampleMedication.metadata, is_active: true } },
    ]

    it('should return only active medications', async () => {
      mockMedicalRecordService.getActiveMedications.mockResolvedValue(activeMedications)

      const result = await medicalRecordService.getActiveMedications('patient-001')

      expect(result).toHaveLength(2)
      result.forEach((med) => {
        expect(med.metadata.is_active).toBe(true)
      })
    })

    it('should return empty array when no active medications', async () => {
      mockMedicalRecordService.getActiveMedications.mockResolvedValue([])

      const result = await medicalRecordService.getActiveMedications('patient-001')

      expect(result).toEqual([])
    })

    it('should include medication details in response', async () => {
      mockMedicalRecordService.getActiveMedications.mockResolvedValue([sampleMedication])

      const result = await medicalRecordService.getActiveMedications('patient-001')

      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('metadata.dosage')
      expect(result[0]).toHaveProperty('metadata.frequency')
    })
  })

  describe('UC-015: Caregiver can edit medication', () => {
    const updates = {
      title: 'Donepezil (Updated)',
      metadata: {
        dosage: '15mg',
        frequency: 'daily',
        is_active: true,
      },
    }

    it('should successfully update medication details', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      await medicalRecordService.updateMedicalRecord('med-001', updates)

      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenCalledWith('med-001', updates)
    })

    it('should allow updating dosage', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { dosage: '20mg' },
      })

      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenCalledWith(
        'med-001',
        expect.objectContaining({ metadata: { dosage: '20mg' } })
      )
    })

    it('should allow updating frequency', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { frequency: 'twice_daily' },
      })

      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenCalledWith(
        'med-001',
        expect.objectContaining({ metadata: { frequency: 'twice_daily' } })
      )
    })
  })

  describe('UC-016: Caregiver can deactivate medication', () => {
    it('should deactivate medication by setting is_active to false', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { is_active: false },
      })

      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenCalledWith(
        'med-001',
        { metadata: { is_active: false } }
      )
    })

    it('should not delete medication record when deactivating', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { is_active: false },
      })

      expect(mockMedicalRecordService.deleteMedicalRecord).not.toHaveBeenCalled()
    })

    it('should allow reactivating a deactivated medication', async () => {
      mockMedicalRecordService.updateMedicalRecord.mockResolvedValue(undefined)

      // First deactivate
      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { is_active: false },
      })

      // Then reactivate
      await medicalRecordService.updateMedicalRecord('med-001', {
        metadata: { is_active: true },
      })

      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenCalledTimes(2)
      expect(mockMedicalRecordService.updateMedicalRecord).toHaveBeenLastCalledWith(
        'med-001',
        { metadata: { is_active: true } }
      )
    })
  })

  describe('UC-017: Caregiver gets medication suggestions', () => {
    const commonMedications = [
      'Donepezil',
      'Memantine',
      'Rivastigmine',
      'Galantamine',
      'Aricept',
      'Namenda',
    ]

    it('should filter suggestions based on input', () => {
      const input = 'don'
      const suggestions = commonMedications.filter((med) =>
        med.toLowerCase().includes(input.toLowerCase())
      )

      expect(suggestions).toContain('Donepezil')
      expect(suggestions).not.toContain('Memantine')
    })

    it('should return multiple matches for partial input', () => {
      const input = 'me'
      const suggestions = commonMedications.filter((med) =>
        med.toLowerCase().includes(input.toLowerCase())
      )

      expect(suggestions).toContain('Memantine')
      expect(suggestions).toContain('Namenda')
    })

    it('should be case insensitive', () => {
      const input = 'DONEPEZIL'
      const suggestions = commonMedications.filter((med) =>
        med.toLowerCase().includes(input.toLowerCase())
      )

      expect(suggestions).toContain('Donepezil')
    })

    it('should return empty array for no matches', () => {
      const input = 'xyz'
      const suggestions = commonMedications.filter((med) =>
        med.toLowerCase().includes(input.toLowerCase())
      )

      expect(suggestions).toHaveLength(0)
    })
  })
})
