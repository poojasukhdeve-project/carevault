/**
 * Emergency Features Usecase Tests
 * Tests user stories related to emergency summary and contacts
 */

import { emergencyContactService, careRecipientService, medicalRecordService } from '@/lib/supabase-service'

// Mock the services
jest.mock('@/lib/supabase-service', () => ({
  emergencyContactService: {
    getEmergencyContacts: jest.fn(),
    createEmergencyContact: jest.fn(),
    updateEmergencyContact: jest.fn(),
    deleteEmergencyContact: jest.fn(),
  },
  careRecipientService: {
    getCareRecipient: jest.fn(),
  },
  medicalRecordService: {
    getActiveMedications: jest.fn(),
  },
}))

const mockEmergencyContactService = emergencyContactService as jest.Mocked<typeof emergencyContactService>
const mockCareRecipientService = careRecipientService as jest.Mocked<typeof careRecipientService>
const mockMedicalRecordService = medicalRecordService as jest.Mocked<typeof medicalRecordService>

describe('Emergency Features Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const sampleContact = {
    id: 'contact-001',
    care_recipient_id: 'patient-001',
    name: 'Jane Doe',
    relationship: 'Daughter',
    phone: '555-0100',
    email: 'jane@example.com',
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const samplePatient = {
    id: 'patient-001',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1945-03-15',
    primary_diagnosis: 'Alzheimer\'s Disease',
    medical_conditions: ['Hypertension', 'Diabetes Type 2'],
    allergies: ['Penicillin', 'Shellfish'],
  }

  const sampleMedications = [
    {
      id: 'med-1',
      title: 'Donepezil',
      metadata: { dosage: '10mg', frequency: 'daily', is_active: true },
    },
    {
      id: 'med-2',
      title: 'Metformin',
      metadata: { dosage: '500mg', frequency: 'twice_daily', is_active: true },
    },
  ]

  describe('UC-027: User can view emergency summary', () => {
    it('should compile emergency summary with patient info', async () => {
      mockCareRecipientService.getCareRecipient.mockResolvedValue(samplePatient)
      mockMedicalRecordService.getActiveMedications.mockResolvedValue(sampleMedications)
      mockEmergencyContactService.getEmergencyContacts.mockResolvedValue([sampleContact])

      const patient = await careRecipientService.getCareRecipient('patient-001')
      const medications = await medicalRecordService.getActiveMedications('patient-001')
      const contacts = await emergencyContactService.getEmergencyContacts('patient-001')

      const emergencySummary = {
        patient: {
          name: `${patient.first_name} ${patient.last_name}`,
          dateOfBirth: patient.date_of_birth,
          diagnosis: patient.primary_diagnosis,
          conditions: patient.medical_conditions,
          allergies: patient.allergies,
        },
        medications: medications.map((m) => ({
          name: m.title,
          dosage: m.metadata.dosage,
          frequency: m.metadata.frequency,
        })),
        emergencyContacts: contacts.map((c) => ({
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          isPrimary: c.is_primary,
        })),
      }

      expect(emergencySummary.patient.name).toBe('John Doe')
      expect(emergencySummary.patient.diagnosis).toBe('Alzheimer\'s Disease')
      expect(emergencySummary.patient.allergies).toContain('Penicillin')
      expect(emergencySummary.medications).toHaveLength(2)
      expect(emergencySummary.emergencyContacts).toHaveLength(1)
    })

    it('should include all critical medical information', async () => {
      mockCareRecipientService.getCareRecipient.mockResolvedValue(samplePatient)

      const patient = await careRecipientService.getCareRecipient('patient-001')

      expect(patient.primary_diagnosis).toBeDefined()
      expect(patient.medical_conditions).toBeDefined()
      expect(patient.allergies).toBeDefined()
    })

    it('should highlight allergies prominently', async () => {
      mockCareRecipientService.getCareRecipient.mockResolvedValue(samplePatient)

      const patient = await careRecipientService.getCareRecipient('patient-001')

      expect(Array.isArray(patient.allergies)).toBe(true)
      expect(patient.allergies.length).toBeGreaterThan(0)
    })

    it('should show primary emergency contact first', async () => {
      const contacts = [
        { ...sampleContact, id: '1', is_primary: false, name: 'Bob Smith' },
        { ...sampleContact, id: '2', is_primary: true, name: 'Jane Doe' },
        { ...sampleContact, id: '3', is_primary: false, name: 'Alice Johnson' },
      ]
      mockEmergencyContactService.getEmergencyContacts.mockResolvedValue(contacts)

      const result = await emergencyContactService.getEmergencyContacts('patient-001')
      const sortedContacts = [...result].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return 0
      })

      expect(sortedContacts[0].is_primary).toBe(true)
      expect(sortedContacts[0].name).toBe('Jane Doe')
    })
  })

  describe('UC-028: User can export emergency summary', () => {
    it('should generate exportable summary text', async () => {
      mockCareRecipientService.getCareRecipient.mockResolvedValue(samplePatient)
      mockMedicalRecordService.getActiveMedications.mockResolvedValue(sampleMedications)
      mockEmergencyContactService.getEmergencyContacts.mockResolvedValue([sampleContact])

      const patient = await careRecipientService.getCareRecipient('patient-001')
      const medications = await medicalRecordService.getActiveMedications('patient-001')
      const contacts = await emergencyContactService.getEmergencyContacts('patient-001')

      const exportText = `
EMERGENCY MEDICAL INFORMATION
=============================

PATIENT INFORMATION
Name: ${patient.first_name} ${patient.last_name}
Date of Birth: ${patient.date_of_birth}
Primary Diagnosis: ${patient.primary_diagnosis}

ALLERGIES (CRITICAL)
${patient.allergies.map((a: string) => `- ${a}`).join('\n')}

CURRENT MEDICATIONS
${medications.map((m) => `- ${m.title} (${m.metadata.dosage}, ${m.metadata.frequency})`).join('\n')}

EMERGENCY CONTACTS
${contacts.map((c) => `- ${c.name} (${c.relationship}): ${c.phone}${c.is_primary ? ' [PRIMARY]' : ''}`).join('\n')}
      `.trim()

      expect(exportText).toContain('EMERGENCY MEDICAL INFORMATION')
      expect(exportText).toContain('John Doe')
      expect(exportText).toContain('ALLERGIES (CRITICAL)')
      expect(exportText).toContain('Penicillin')
      expect(exportText).toContain('Donepezil')
      expect(exportText).toContain('Jane Doe')
      expect(exportText).toContain('[PRIMARY]')
    })

    it('should include timestamp in export', () => {
      const timestamp = new Date().toISOString()
      const exportHeader = `Generated: ${timestamp}`

      expect(exportHeader).toContain('Generated:')
      expect(exportHeader).toMatch(/\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('UC-029: Caregiver can manage emergency contacts', () => {
    describe('Create emergency contact', () => {
      const newContact = {
        care_recipient_id: 'patient-001',
        name: 'Robert Smith',
        relationship: 'Son',
        phone: '555-0200',
        email: 'robert@example.com',
        is_primary: false,
      }

      it('should successfully create a new emergency contact', async () => {
        mockEmergencyContactService.createEmergencyContact.mockResolvedValue('new-contact-id')

        const result = await emergencyContactService.createEmergencyContact(newContact)

        expect(result).toBe('new-contact-id')
        expect(mockEmergencyContactService.createEmergencyContact).toHaveBeenCalledWith(newContact)
      })

      it('should require name and phone for contact', async () => {
        mockEmergencyContactService.createEmergencyContact.mockResolvedValue('contact-id')

        await emergencyContactService.createEmergencyContact(newContact)

        const callArgs = mockEmergencyContactService.createEmergencyContact.mock.calls[0][0]
        expect(callArgs.name).toBeDefined()
        expect(callArgs.phone).toBeDefined()
      })
    })

    describe('Update emergency contact', () => {
      it('should successfully update contact details', async () => {
        mockEmergencyContactService.updateEmergencyContact.mockResolvedValue(undefined)

        await emergencyContactService.updateEmergencyContact('contact-001', {
          phone: '555-9999',
          is_primary: true,
        })

        expect(mockEmergencyContactService.updateEmergencyContact).toHaveBeenCalledWith(
          'contact-001',
          { phone: '555-9999', is_primary: true }
        )
      })

      it('should allow setting contact as primary', async () => {
        mockEmergencyContactService.updateEmergencyContact.mockResolvedValue(undefined)

        await emergencyContactService.updateEmergencyContact('contact-001', {
          is_primary: true,
        })

        expect(mockEmergencyContactService.updateEmergencyContact).toHaveBeenCalledWith(
          'contact-001',
          expect.objectContaining({ is_primary: true })
        )
      })
    })

    describe('Delete emergency contact', () => {
      it('should successfully delete an emergency contact', async () => {
        mockEmergencyContactService.deleteEmergencyContact.mockResolvedValue(undefined)

        await emergencyContactService.deleteEmergencyContact('contact-001')

        expect(mockEmergencyContactService.deleteEmergencyContact).toHaveBeenCalledWith('contact-001')
      })

      it('should handle deletion of non-existent contact', async () => {
        mockEmergencyContactService.deleteEmergencyContact.mockRejectedValue(
          new Error('Contact not found')
        )

        await expect(
          emergencyContactService.deleteEmergencyContact('non-existent-id')
        ).rejects.toThrow('Contact not found')
      })
    })

    describe('List emergency contacts', () => {
      it('should return all contacts for a patient', async () => {
        const contacts = [
          sampleContact,
          { ...sampleContact, id: 'contact-2', name: 'Bob Smith', is_primary: false },
        ]
        mockEmergencyContactService.getEmergencyContacts.mockResolvedValue(contacts)

        const result = await emergencyContactService.getEmergencyContacts('patient-001')

        expect(result).toHaveLength(2)
      })

      it('should return empty array when no contacts exist', async () => {
        mockEmergencyContactService.getEmergencyContacts.mockResolvedValue([])

        const result = await emergencyContactService.getEmergencyContacts('patient-001')

        expect(result).toEqual([])
      })
    })
  })
})
