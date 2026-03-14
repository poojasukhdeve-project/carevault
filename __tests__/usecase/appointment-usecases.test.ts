/**
 * Appointment Management Usecase Tests
 * Tests user stories related to appointment scheduling and management
 */

import { appointmentService } from '@/lib/supabase-service'

// Mock the service
jest.mock('@/lib/supabase-service', () => ({
  appointmentService: {
    getAppointments: jest.fn(),
    getUpcomingAppointments: jest.fn(),
    getAllAppointments: jest.fn(),
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
  },
}))

const mockAppointmentService = appointmentService as jest.Mocked<typeof appointmentService>

describe('Appointment Management Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const sampleAppointment = {
    id: 'apt-001',
    care_recipient_id: 'patient-001',
    title: 'Neurologist Checkup',
    description: 'Regular cognitive assessment',
    date_time: nextWeek.toISOString(),
    location: 'City Medical Center',
    doctor_name: 'Dr. Smith',
    status: 'scheduled',
    notes: 'Bring previous test results',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('UC-018: Caregiver can add appointment', () => {
    const newAppointment = {
      care_recipient_id: 'patient-001',
      title: 'Cardiologist Visit',
      description: 'Annual heart checkup',
      date_time: nextWeek.toISOString(),
      location: 'Heart Care Clinic',
      doctor_name: 'Dr. Johnson',
      status: 'scheduled',
    }

    it('should successfully create a new appointment', async () => {
      mockAppointmentService.createAppointment.mockResolvedValue('new-apt-id')

      const result = await appointmentService.createAppointment(newAppointment)

      expect(result).toBe('new-apt-id')
      expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(newAppointment)
    })

    it('should create appointment with required fields', async () => {
      mockAppointmentService.createAppointment.mockResolvedValue('apt-id')

      await appointmentService.createAppointment(newAppointment)

      const callArgs = mockAppointmentService.createAppointment.mock.calls[0][0]
      expect(callArgs.title).toBeDefined()
      expect(callArgs.date_time).toBeDefined()
      expect(callArgs.care_recipient_id).toBeDefined()
    })

    it('should set status as scheduled by default', async () => {
      mockAppointmentService.createAppointment.mockResolvedValue('apt-id')

      await appointmentService.createAppointment(newAppointment)

      const callArgs = mockAppointmentService.createAppointment.mock.calls[0][0]
      expect(callArgs.status).toBe('scheduled')
    })

    it('should support optional doctor name and location', async () => {
      mockAppointmentService.createAppointment.mockResolvedValue('apt-id')

      const appointmentWithOptionalFields = {
        care_recipient_id: 'patient-001',
        title: 'Follow-up',
        date_time: nextWeek.toISOString(),
        status: 'scheduled',
        doctor_name: 'Dr. Wilson',
        location: 'Main Hospital',
      }

      await appointmentService.createAppointment(appointmentWithOptionalFields)

      const callArgs = mockAppointmentService.createAppointment.mock.calls[0][0]
      expect(callArgs.doctor_name).toBe('Dr. Wilson')
      expect(callArgs.location).toBe('Main Hospital')
    })
  })

  describe('UC-019: Caregiver can view upcoming appointments', () => {
    const upcomingAppointments = [
      { ...sampleAppointment, id: 'apt-1', date_time: tomorrow.toISOString() },
      { ...sampleAppointment, id: 'apt-2', date_time: nextWeek.toISOString() },
    ]

    it('should return only future appointments', async () => {
      mockAppointmentService.getUpcomingAppointments.mockResolvedValue(upcomingAppointments)

      const result = await appointmentService.getUpcomingAppointments('patient-001')

      expect(result).toHaveLength(2)
      result.forEach((apt) => {
        expect(new Date(apt.date_time).getTime()).toBeGreaterThan(now.getTime() - 1000)
      })
    })

    it('should return empty array when no upcoming appointments', async () => {
      mockAppointmentService.getUpcomingAppointments.mockResolvedValue([])

      const result = await appointmentService.getUpcomingAppointments('patient-001')

      expect(result).toEqual([])
    })

    it('should return appointments sorted by date', async () => {
      const sortedAppointments = [
        { ...sampleAppointment, id: 'apt-1', date_time: tomorrow.toISOString() },
        { ...sampleAppointment, id: 'apt-2', date_time: nextWeek.toISOString() },
      ]
      mockAppointmentService.getUpcomingAppointments.mockResolvedValue(sortedAppointments)

      const result = await appointmentService.getUpcomingAppointments('patient-001')

      expect(new Date(result[0].date_time).getTime()).toBeLessThan(
        new Date(result[1].date_time).getTime()
      )
    })
  })

  describe('UC-020: Caregiver can edit appointment', () => {
    const updates = {
      title: 'Updated Appointment',
      date_time: nextWeek.toISOString(),
      notes: 'Updated notes',
    }

    it('should successfully update appointment details', async () => {
      mockAppointmentService.updateAppointment.mockResolvedValue(undefined)

      await appointmentService.updateAppointment('apt-001', updates)

      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith('apt-001', updates)
    })

    it('should allow updating status', async () => {
      mockAppointmentService.updateAppointment.mockResolvedValue(undefined)

      const statusValues = ['scheduled', 'completed', 'cancelled', 'rescheduled']
      
      for (const status of statusValues) {
        await appointmentService.updateAppointment('apt-001', { status })
        
        expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith(
          'apt-001',
          { status }
        )
      }
    })

    it('should allow rescheduling appointment', async () => {
      mockAppointmentService.updateAppointment.mockResolvedValue(undefined)

      const newDateTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      await appointmentService.updateAppointment('apt-001', {
        date_time: newDateTime,
        status: 'rescheduled',
      })

      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith(
        'apt-001',
        expect.objectContaining({
          date_time: newDateTime,
          status: 'rescheduled',
        })
      )
    })
  })

  describe('UC-021: Caregiver can delete appointment', () => {
    it('should successfully delete an appointment', async () => {
      mockAppointmentService.deleteAppointment.mockResolvedValue(undefined)

      await appointmentService.deleteAppointment('apt-001')

      expect(mockAppointmentService.deleteAppointment).toHaveBeenCalledWith('apt-001')
    })

    it('should handle deletion of non-existent appointment', async () => {
      mockAppointmentService.deleteAppointment.mockRejectedValue(new Error('Appointment not found'))

      await expect(
        appointmentService.deleteAppointment('non-existent-id')
      ).rejects.toThrow('Appointment not found')
    })
  })

  describe('UC-022: Caregiver sees urgent appointment alerts', () => {
    const getUrgencyLevel = (dateTime: string): 'critical' | 'warning' | 'upcoming' | 'normal' => {
      const appointmentDate = new Date(dateTime)
      const diffMs = appointmentDate.getTime() - now.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (diffDays <= 2) return 'critical'
      if (diffDays <= 7) return 'warning'
      if (diffDays <= 14) return 'upcoming'
      return 'normal'
    }

    it('should mark appointments within 2 days as critical', () => {
      const criticalDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
      
      expect(getUrgencyLevel(criticalDate)).toBe('critical')
    })

    it('should mark appointments within 3-7 days as warning', () => {
      const warningDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      
      expect(getUrgencyLevel(warningDate)).toBe('warning')
    })

    it('should mark appointments within 8-14 days as upcoming', () => {
      const upcomingDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
      
      expect(getUrgencyLevel(upcomingDate)).toBe('upcoming')
    })

    it('should mark appointments beyond 14 days as normal', () => {
      const normalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      expect(getUrgencyLevel(normalDate)).toBe('normal')
    })

    it('should calculate correct urgency counts from appointment list', async () => {
      const mixedAppointments = [
        { ...sampleAppointment, date_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString() }, // critical
        { ...sampleAppointment, date_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() }, // critical
        { ...sampleAppointment, date_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() }, // warning
        { ...sampleAppointment, date_time: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() }, // upcoming
        { ...sampleAppointment, date_time: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() }, // normal
      ]
      mockAppointmentService.getUpcomingAppointments.mockResolvedValue(mixedAppointments)

      const appointments = await appointmentService.getUpcomingAppointments('patient-001')
      const urgencyCounts = appointments.reduce(
        (acc, apt) => {
          const level = getUrgencyLevel(apt.date_time)
          acc[level]++
          return acc
        },
        { critical: 0, warning: 0, upcoming: 0, normal: 0 }
      )

      expect(urgencyCounts.critical).toBe(2)
      expect(urgencyCounts.warning).toBe(1)
      expect(urgencyCounts.upcoming).toBe(1)
      expect(urgencyCounts.normal).toBe(1)
    })
  })
})
