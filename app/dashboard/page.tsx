'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Heart, Pill, User, Users, AlertCircle, FileCheck, Calendar, X, Trash2, Upload, Download, ExternalLink, Edit, Shield, LogOut, UserCircle, DollarSign, Phone, Clock } from 'lucide-react'
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import EmergencySummary from '@/components/EmergencySummary'
import { 
  careRecipientService,
  medicalRecordService,
  appointmentService, 
  documentService,
  emergencyContactService
} from '@/lib/supabase-service'
import type { 
  CareRecipient,
  MedicalRecord,
  Appointment, 
  DocumentRecord,
  EmergencyContact,
  AppointmentStatus
} from '@/types/supabase'

type DocumentCategory = 'legal' | 'medical' | 'financial' | 'identification'
type ActiveSection = 'medications' | 'appointments' | 'documents' | 'careLogs' | 'financial' | 'contacts' | null

function CaregiverDashboard() {
  const { user, userRole, userProfile } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  
  const [patients, setPatients] = useState<CareRecipient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<CareRecipient | null>(null)
  const [medications, setMedications] = useState<MedicalRecord[]>([])
  const [careLogs, setCareLogs] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [financialDocs, setFinancialDocs] = useState<DocumentRecord[]>([])
  
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
  
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [showCareLogForm, setShowCareLogForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showFinancialForm, setShowFinancialForm] = useState(false)
  const [showEmergencySummary, setShowEmergencySummary] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const [medicationSearch, setMedicationSearch] = useState('')
  const [appointmentSearch, setAppointmentSearch] = useState('')
  
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFinancialFile, setSelectedFinancialFile] = useState<File | null>(null)

  const [patientForm, setPatientForm] = useState({
    patient_email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    diagnosis: '',
    medications: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  })
  
  const commonDiagnoses = [
    'Alzheimer\'s Disease',
    'Dementia',
    'Parkinson\'s Disease',
    'Diabetes Type 2',
    'Hypertension',
    'Heart Failure',
    'COPD',
    'Arthritis',
    'Osteoporosis',
    'Depression'
  ]
  
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<string[]>([])
  const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false)

  const [medicationForm, setMedicationForm] = useState({
    name: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const commonMedications = [
    'Aspirin',
    'Metformin',
    'Lisinopril',
    'Atorvastatin',
    'Levothyroxine',
    'Amlodipine',
    'Omeprazole',
    'Losartan',
    'Gabapentin',
    'Hydrochlorothiazide',
    'Sertraline',
    'Simvastatin',
    'Donepezil'
  ]
  
  const [medicationSuggestions, setMedicationSuggestions] = useState<string[]>([])
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false)

  const [careLogForm, setCareLogForm] = useState({
    name: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    appointmentDate: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
    location: '',
    remindBeforeMinutes: 30,
    repeatInterval: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
  })

  const [documentForm, setDocumentForm] = useState({
    name: '',
    category: 'medical' as DocumentCategory,
    date: new Date().toISOString().split('T')[0]
  })

  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    is_primary: false
  })

  const [financialForm, setFinancialForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Load patients on mount
  useEffect(() => {
    if (!user || !userProfile) return
    
    const loadPatients = async () => {
      if (permissions.isCaregiver) {
        const careRecipients = await careRecipientService.getCareRecipientsByCaregiver(user.id)
        setPatients(careRecipients)
        if (careRecipients.length > 0) {
          setSelectedPatient(careRecipients[0])
        }
      } else if (permissions.isPatient && userProfile.email) {
        const careRecipient = await careRecipientService.getCareRecipientByEmail(userProfile.email)
        if (careRecipient) {
          setPatients([careRecipient])
          setSelectedPatient(careRecipient)
        }
      }
    }
    
    loadPatients()
  }, [user, userProfile, permissions.isCaregiver, permissions.isPatient])

  // Load patient data when selected patient changes
  useEffect(() => {
    if (!selectedPatient) return

    const loadPatientData = async () => {
      const [meds, logs, appts, docs, cts] = await Promise.all([
        medicalRecordService.getActiveMedications(selectedPatient.id),
        medicalRecordService.getMedicalRecords(selectedPatient.id),
        appointmentService.getAppointments(selectedPatient.id),
        documentService.getDocuments(selectedPatient.id),
        emergencyContactService.getEmergencyContacts(selectedPatient.id)
      ])

      setMedications(meds)
      setCareLogs(logs)
      setAppointments(appts)
      // Split docs: financial vs non-financial
      setDocuments(docs.filter(d => d.category !== 'financial'))
      setFinancialDocs(docs.filter(d => d.category === 'financial'))
      setContacts(cts)
    }

    loadPatientData()
  }, [selectedPatient])

  // Patient Management
  const handleAddPatient = async () => {
    if (!user || !permissions.hasPermission('canEditPatientInfo')) return

    try {
      const patientId = await careRecipientService.createCareRecipient({
        caregiver_id: user.id,
        patient_email: patientForm.patient_email || undefined,
        first_name: patientForm.first_name,
        last_name: patientForm.last_name,
        date_of_birth: patientForm.date_of_birth,
        diagnosis: patientForm.diagnosis || undefined,
        allergies: patientForm.allergies || undefined,
        emergency_contact_name: patientForm.emergency_contact_name || undefined,
        emergency_contact_phone: patientForm.emergency_contact_phone || undefined,
        emergency_contact_relationship: patientForm.emergency_contact_relationship || undefined,
        is_active: true
      })

      const newPatient = await careRecipientService.getCareRecipient(patientId)
      if (newPatient) {
        setPatients([...patients, newPatient])
        setSelectedPatient(newPatient)
      }

      setShowPatientForm(false)
      resetPatientForm()
    } catch (error: any) {
      console.error('Error adding patient:', error)
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to add patient'
      alert(`Failed to add patient: ${errorMessage}`)
    }
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient || !permissions.hasPermission('canEditPatientInfo')) return

    try {
      await careRecipientService.updateCareRecipient(selectedPatient.id, {
        patient_email: patientForm.patient_email || undefined,
        first_name: patientForm.first_name,
        last_name: patientForm.last_name,
        date_of_birth: patientForm.date_of_birth,
        diagnosis: patientForm.diagnosis || undefined,
        allergies: patientForm.allergies || undefined,
        emergency_contact_name: patientForm.emergency_contact_name || undefined,
        emergency_contact_phone: patientForm.emergency_contact_phone || undefined,
        emergency_contact_relationship: patientForm.emergency_contact_relationship || undefined
      })
      
      const updatedPatient = { ...selectedPatient, ...patientForm }
      setSelectedPatient(updatedPatient as CareRecipient)
      setPatients(patients.map(p => p.id === selectedPatient.id ? updatedPatient as CareRecipient : p))
      
      setShowPatientForm(false)
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Failed to update patient')
    }
  }

  const handleDeletePatient = async (id: string) => {
    if (!permissions.hasPermission('canEditPatientInfo')) return
    
    if (!confirm('Are you sure you want to delete this patient? All associated data will be removed.')) {
      return
    }

    try {
      await careRecipientService.deleteCareRecipient(id)
      const remaining = patients.filter(p => p.id !== id)
      setPatients(remaining)
      setSelectedPatient(remaining.length > 0 ? remaining[0] : null)
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Failed to delete patient')
    }
  }

  // Medication Management
  const handleAddMedication = async () => {
    if (!selectedPatient || !permissions.hasPermission('canManageMedications')) return

    try {
      const medId = await medicalRecordService.createMedicalRecord({
        care_recipient_id: selectedPatient.id,
        type: 'medication',
        title: medicationForm.name,
        description: medicationForm.details,
        date: medicationForm.date,
        is_active: true
      })

      const newMedication: MedicalRecord = {
        id: medId,
        care_recipient_id: selectedPatient.id,
        type: 'medication',
        title: medicationForm.name,
        description: medicationForm.details,
        date: medicationForm.date,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setMedications([...medications, newMedication])
      setShowMedicationForm(false)
      resetMedicationForm()
    } catch (error) {
      console.error('Error adding medication:', error)
      alert('Failed to add medication')
    }
  }

  const handleDeleteMedication = async (id: string) => {
    if (!permissions.hasPermission('canManageMedications')) return

    try {
      await medicalRecordService.deleteMedicalRecord(id)
      setMedications(medications.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting medication:', error)
      alert('Failed to delete medication')
    }
  }

  // Care Log Management
  const handleAddCareLog = async () => {
    if (!selectedPatient || !user || !permissions.hasPermission('canAddCareLogs')) return

    try {
      const logId = await medicalRecordService.createMedicalRecord({
        care_recipient_id: selectedPatient.id,
        type: 'condition',
        title: careLogForm.name,
        description: careLogForm.details,
        date: careLogForm.date,
        is_active: true
      })

      const newLog: MedicalRecord = {
        id: logId,
        care_recipient_id: selectedPatient.id,
        type: 'condition',
        title: careLogForm.name,
        description: careLogForm.details,
        date: careLogForm.date,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setCareLogs([newLog, ...careLogs])
      setShowCareLogForm(false)
      resetCareLogForm()
    } catch (error) {
      console.error('Error adding care log:', error)
      alert('Failed to add care log')
    }
  }

  const handleDeleteCareLog = async (id: string) => {
    if (!permissions.hasPermission('canDeleteCareLogs')) return

    try {
      await medicalRecordService.deleteMedicalRecord(id)
      setCareLogs(careLogs.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting care log:', error)
      alert('Failed to delete care log')
    }
  }

  // Appointment Management
  const handleAddAppointment = async () => {
    if (!selectedPatient || !permissions.hasPermission('canManageAppointments')) return

    try {
      const apptId = await appointmentService.createAppointment({
        care_recipient_id: selectedPatient.id,
        appointment_date: appointmentForm.appointmentDate,
        title: appointmentForm.title,
        description: appointmentForm.description,
        location: appointmentForm.location,
        status: 'scheduled'
      })

      const newAppointment: Appointment = {
        id: apptId,
        care_recipient_id: selectedPatient.id,
        appointment_date: appointmentForm.appointmentDate,
        title: appointmentForm.title,
        description: appointmentForm.description,
        location: appointmentForm.location,
        status: 'scheduled' as AppointmentStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Appointment

      setAppointments([...appointments, newAppointment])
      setShowAppointmentForm(false)
      resetAppointmentForm()
    } catch (error) {
      console.error('Error adding appointment:', error)
      alert('Failed to add appointment')
    }
  }

  const handleToggleAppointment = async (id: string, isCompleted: boolean) => {
    if (!permissions.hasPermission('canManageAppointments')) return

    try {
      await appointmentService.updateAppointment(id, { status: isCompleted ? 'scheduled' : 'completed' })
      setAppointments(appointments.map(a => 
        a.id === id ? { ...a, status: isCompleted ? 'scheduled' : 'completed' } : a
      ))
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!permissions.hasPermission('canManageAppointments')) return

    try {
      await appointmentService.deleteAppointment(id)
      setAppointments(appointments.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Failed to delete appointment')
    }
  }

  // Document Management
  const handleUploadDocument = async () => {
    if (!selectedPatient || !selectedFile || !permissions.hasPermission('canUploadDocuments')) return

    setUploadingFile(true)
    try {
      await documentService.uploadDocument(selectedFile, selectedPatient.id, {
        name: documentForm.name,
        category: documentForm.category,
        description: documentForm.date
      })

      const docs = await documentService.getDocuments(selectedPatient.id)
      setDocuments(docs.filter(d => d.category !== 'financial'))
      setFinancialDocs(docs.filter(d => d.category === 'financial'))

      setShowDocumentForm(false)
      resetDocumentForm()
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteDocument = async (id: string, fileUrl: string) => {
    if (!permissions.hasPermission('canDeleteDocuments')) return

    try {
      await documentService.deleteDocument(id, fileUrl)
      setDocuments(documents.filter(d => d.id !== id))
      setFinancialDocs(financialDocs.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  // Contact Management
  const handleAddContact = async () => {
    if (!selectedPatient || !permissions.hasPermission('canManageContacts')) return

    try {
      const contactId = await emergencyContactService.createEmergencyContact({
        care_recipient_id: selectedPatient.id,
        name: contactForm.name,
        relationship: contactForm.relationship || undefined,
        phone: contactForm.phone || undefined,
        email: contactForm.email || undefined,
        is_primary: contactForm.is_primary
      })

      const newContact: EmergencyContact = {
        id: contactId,
        care_recipient_id: selectedPatient.id,
        name: contactForm.name,
        relationship: contactForm.relationship || undefined,
        phone: contactForm.phone || undefined,
        email: contactForm.email || undefined,
        is_primary: contactForm.is_primary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setContacts([...contacts, newContact])
      setShowContactForm(false)
      resetContactForm()
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add contact')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!permissions.hasPermission('canManageContacts')) return

    try {
      await emergencyContactService.deleteEmergencyContact(id)
      setContacts(contacts.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  // Financial Document Upload
  const handleUploadFinancial = async () => {
    if (!selectedPatient || !selectedFinancialFile || !permissions.hasPermission('canManageFinancials')) return

    setUploadingFile(true)
    try {
      await documentService.uploadDocument(selectedFinancialFile, selectedPatient.id, {
        name: financialForm.name,
        category: 'financial',
        description: financialForm.date
      })

      const docs = await documentService.getDocuments(selectedPatient.id)
      setDocuments(docs.filter(d => d.category !== 'financial'))
      setFinancialDocs(docs.filter(d => d.category === 'financial'))

      setShowFinancialForm(false)
      resetFinancialForm()
      setSelectedFinancialFile(null)
    } catch (error) {
      console.error('Error uploading financial document:', error)
      alert('Failed to upload financial document')
    } finally {
      setUploadingFile(false)
    }
  }

  // Form reset helpers
  const resetPatientForm = () => {
    setPatientForm({
      patient_email: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      diagnosis: '',
      medications: '',
      allergies: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: ''
    })
  }

  const resetMedicationForm = () => {
    setMedicationForm({ name: '', details: '', date: new Date().toISOString().split('T')[0] })
  }

  const resetCareLogForm = () => {
    setCareLogForm({ name: '', details: '', date: new Date().toISOString().split('T')[0] })
  }

  const resetAppointmentForm = () => {
    setAppointmentForm({
      title: '', description: '',
      appointmentDate: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
      location: '', remindBeforeMinutes: 30, repeatInterval: 'none'
    })
  }

  const resetDocumentForm = () => {
    setDocumentForm({ name: '', category: 'medical', date: new Date().toISOString().split('T')[0] })
  }

  const resetContactForm = () => {
    setContactForm({ name: '', relationship: '', phone: '', email: '', is_primary: false })
  }

  const resetFinancialForm = () => {
    setFinancialForm({ name: '', date: new Date().toISOString().split('T')[0] })
  }

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' && new Date(a.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

  const activeMedications = medications
  
  const filteredMedications = activeMedications.filter(med => 
    medicationSearch === '' || 
    med.title.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    med.description?.toLowerCase().includes(medicationSearch.toLowerCase())
  )
  
  const filteredAppointments = upcomingAppointments.filter(appt =>
    appointmentSearch === '' ||
    appt.title.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
    appt.description?.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
    appt.location?.toLowerCase().includes(appointmentSearch.toLowerCase())
  )

  // Urgent appointments within 7 days
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const urgentAppointments = upcomingAppointments.filter(a => {
    const apptDate = new Date(a.appointment_date)
    return apptDate <= weekFromNow
  })

  const getUrgencyLevel = (date: string) => {
    const apptDate = new Date(date)
    const hoursUntil = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntil < 24) return 'critical'
    if (hoursUntil < 72) return 'warning'
    return 'normal'
  }

  const getTimeUntil = (date: string) => {
    const apptDate = new Date(date)
    const hoursUntil = Math.floor((apptDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (hoursUntil < 1) return 'Less than 1 hour'
    if (hoursUntil < 24) return `${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`
    const daysUntil = Math.floor(hoursUntil / 24)
    return `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
  }

  // Section tile definitions with distinct colors
  const sectionTiles = [
    { id: 'medications' as ActiveSection, label: 'Medications', icon: Pill, count: activeMedications.length, bgColor: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', lightBg: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'appointments' as ActiveSection, label: 'Appointments', icon: Calendar, count: upcomingAppointments.length, bgColor: 'bg-green-500', hoverColor: 'hover:bg-green-600', lightBg: 'bg-green-50', textColor: 'text-green-700' },
    { id: 'documents' as ActiveSection, label: 'Documents', icon: FileText, count: documents.length, bgColor: 'bg-orange-500', hoverColor: 'hover:bg-orange-600', lightBg: 'bg-orange-50', textColor: 'text-orange-700' },
    { id: 'careLogs' as ActiveSection, label: 'Care Logs', icon: Heart, count: careLogs.length, bgColor: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', lightBg: 'bg-purple-50', textColor: 'text-purple-700' },
    { id: 'financial' as ActiveSection, label: 'Financial', icon: DollarSign, count: financialDocs.length, bgColor: 'bg-teal-500', hoverColor: 'hover:bg-teal-600', lightBg: 'bg-teal-50', textColor: 'text-teal-700' },
    { id: 'contacts' as ActiveSection, label: 'Contacts', icon: Phone, count: contacts.length, bgColor: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', lightBg: 'bg-rose-50', textColor: 'text-rose-700' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CareVault</h1>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <p className="text-xs text-muted-foreground">
                    {userRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Portal (Read-Only)'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedPatient && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowEmergencySummary(true)}
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Emergency Summary
                  </Button>
                  
                  {permissions.isCaregiver && patients.length > 1 && (
                    <select
                      value={selectedPatient.id}
                      onChange={(e) => {
                        const patient = patients.find(p => p.id === e.target.value)
                        setSelectedPatient(patient || null)
                        setActiveSection(null)
                      }}
                      className="px-3 py-2 border rounded-lg"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              
              {permissions.isCaregiver && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/calendar')}
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/patients')}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    All Patients
                  </Button>
                  <Button onClick={() => {
                    setSelectedPatient(null)
                    resetPatientForm()
                    setShowPatientForm(true)
                  }}>
                    <Users className="w-4 h-4 mr-2" />
                    Add Patient
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowProfileModal(true)}
                title="Profile"
              >
                <UserCircle className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  await supabase?.auth.signOut()
                  router.push('/login')
                }}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Urgent Appointments Alert */}
        {selectedPatient && urgentAppointments.length > 0 && (
          <div className="mb-6">
            <Card className="border-l-4 border-orange-500 bg-orange-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg text-orange-900">
                    Upcoming Appointments ({urgentAppointments.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-orange-700">
                  Appointments scheduled within the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentAppointments.map(appt => {
                  const urgency = getUrgencyLevel(appt.appointment_date)
                  const timeUntil = getTimeUntil(appt.appointment_date)
                  
                  return (
                    <div 
                      key={appt.id} 
                      className={`p-3 rounded-lg border ${
                        urgency === 'critical' 
                          ? 'bg-red-50 border-red-200' 
                          : urgency === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              urgency === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : urgency === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {urgency === 'critical' ? 'URGENT' : urgency === 'warning' ? 'SOON' : 'UPCOMING'}
                            </span>
                            <span className="text-sm font-medium">{appt.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appt.appointment_date).toLocaleString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-1">
                            In {timeUntil}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedPatient ? (
          permissions.isCaregiver ? (
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3 text-primary">Welcome to CareVault</h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    Start managing care by adding your first patient
                  </p>
                  <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                    As a caregiver, you can track medications, appointments, medical records, and care logs for all your patients in one secure place.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => setShowPatientForm(true)}
                    className="gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Add Your First Patient
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-12 border-orange-200 bg-orange-50/50">
              <CardContent>
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h2 className="text-2xl font-bold mb-2">No Care Record Found</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Your caregiver needs to add you as a patient to their care list. Please contact your caregiver to link your account.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-white px-4 py-2 rounded-lg border">
                  <Shield className="w-4 h-4" />
                  <span>Patient Portal (Read-Only Access)</span>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="space-y-6">
            {/* Patient Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedPatient.first_name} {selectedPatient.last_name}</CardTitle>
                    <CardDescription>
                      Born: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {permissions.hasPermission('canEditPatientInfo') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPatientForm({
                            patient_email: selectedPatient.patient_email || '',
                            first_name: selectedPatient.first_name,
                            last_name: selectedPatient.last_name,
                            date_of_birth: selectedPatient.date_of_birth,
                            diagnosis: selectedPatient.diagnosis || '',
                            medications: '',
                            allergies: selectedPatient.allergies || '',
                            emergency_contact_name: selectedPatient.emergency_contact_name || '',
                            emergency_contact_phone: selectedPatient.emergency_contact_phone || '',
                            emergency_contact_relationship: selectedPatient.emergency_contact_relationship || ''
                          })
                          setShowPatientForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {patients.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeletePatient(selectedPatient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedPatient.emergency_contact_name && (
                    <div>
                      <p className="text-sm font-medium">Emergency Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.emergency_contact_name} - {selectedPatient.emergency_contact_phone}
                      </p>
                    </div>
                  )}
                  {selectedPatient.allergies && (
                    <div>
                      <p className="text-sm font-medium">Allergies</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.allergies}</p>
                    </div>
                  )}
                  {selectedPatient.diagnosis && (
                    <div>
                      <p className="text-sm font-medium">Diagnosis</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.diagnosis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Square Icon Tile Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sectionTiles.map(tile => {
                const Icon = tile.icon
                const isActive = activeSection === tile.id
                return (
                  <button
                    key={tile.id}
                    onClick={() => setActiveSection(isActive ? null : tile.id)}
                    className={`flex flex-col items-center justify-center aspect-square rounded-2xl transition-all duration-200 border-2 ${
                      isActive
                        ? `${tile.bgColor} text-white border-transparent shadow-lg scale-105`
                        : `bg-white ${tile.hoverColor.replace('hover:', '')} hover:text-white border-gray-200 hover:border-transparent hover:shadow-lg`
                    }`}
                  >
                    <Icon className="w-10 h-10 mb-2" />
                    <span className="text-sm font-semibold">{tile.label}</span>
                    <span className={`text-2xl font-bold mt-1 ${isActive ? 'text-white' : ''}`}>{tile.count}</span>
                  </button>
                )
              })}
            </div>

            {/* Active Section Content */}
            {activeSection === 'medications' && (
              <Card className="border-t-4 border-blue-500">
                <CardHeader>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        <CardTitle>Medications</CardTitle>
                      </div>
                      {permissions.hasPermission('canManageMedications') && (
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => setShowMedicationForm(true)}>
                          Add Medication
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Search medications..."
                        value={medicationSearch}
                        onChange={(e) => setMedicationSearch(e.target.value)}
                        className="pr-8"
                      />
                      {medicationSearch && (
                        <button
                          onClick={() => setMedicationSearch('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredMedications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {medicationSearch ? 'No matching medications' : 'No active medications'}
                    </p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                      <div className="space-y-4">
                        {filteredMedications
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((med, index) => (
                            <div key={med.id} className="relative pl-10">
                              <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                              <div className="p-3 border rounded-lg bg-white">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{med.title}</p>
                                    {med.description && <p className="text-sm text-muted-foreground mt-1">{med.description}</p>}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                        Started {new Date(med.date).toLocaleDateString()}
                                      </span>
                                      {index === 0 && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">Current</span>
                                      )}
                                    </div>
                                  </div>
                                  {permissions.hasPermission('canManageMedications') && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMedication(med.id)}>
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'appointments' && (
              <Card className="border-t-4 border-green-500">
                <CardHeader>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <CardTitle>Appointments</CardTitle>
                      </div>
                      {permissions.hasPermission('canManageAppointments') && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setShowAppointmentForm(true)}>
                          Add Appointment
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Search appointments..."
                        value={appointmentSearch}
                        onChange={(e) => setAppointmentSearch(e.target.value)}
                        className="pr-8"
                      />
                      {appointmentSearch && (
                        <button
                          onClick={() => setAppointmentSearch('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {appointmentSearch ? 'No matching appointments' : 'No upcoming appointments'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredAppointments.map(appt => (
                        <div key={appt.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{appt.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(appt.appointment_date).toLocaleString()}
                              </p>
                              {appt.location && (
                                <p className="text-xs text-muted-foreground mt-1">Location: {appt.location}</p>
                              )}
                              {appt.description && (
                                <p className="text-xs text-muted-foreground mt-1">{appt.description}</p>
                              )}
                            </div>
                            {permissions.hasPermission('canManageAppointments') && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => handleToggleAppointment(appt.id, appt.status === 'completed')}>
                                  <FileCheck className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => handleDeleteAppointment(appt.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'documents' && (
              <Card className="border-t-4 border-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <CardTitle>Documents</CardTitle>
                    </div>
                    {permissions.hasPermission('canUploadDocuments') && (
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowDocumentForm(true)}>
                        Upload Document
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-orange-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.category} - {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => window.open(doc.file_url, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            {permissions.hasPermission('canDeleteDocuments') && (
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => handleDeleteDocument(doc.id, doc.file_url || '')}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'careLogs' && (
              <Card className="border-t-4 border-purple-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-purple-500" />
                      <CardTitle>Care Logs</CardTitle>
                    </div>
                    {permissions.hasPermission('canAddCareLogs') && (
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowCareLogForm(true)}>
                        Add Log
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {careLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No care logs yet</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-purple-50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-purple-900">Timestamp</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-purple-900">Activity</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-purple-900">Details</th>
                            {permissions.hasPermission('canDeleteCareLogs') && (
                              <th className="text-right px-4 py-3 text-sm font-medium text-purple-900 w-16">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {careLogs
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(log.created_at).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: 'numeric', minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">{log.title}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{log.description || '-'}</td>
                              {permissions.hasPermission('canDeleteCareLogs') && (
                                <td className="px-4 py-3 text-right">
                                  <Button variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => handleDeleteCareLog(log.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'financial' && (
              <Card className="border-t-4 border-teal-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-teal-500" />
                      <CardTitle>Financial Information</CardTitle>
                    </div>
                    {permissions.hasPermission('canManageFinancials') && (
                      <Button size="sm" className="bg-teal-500 hover:bg-teal-600" onClick={() => setShowFinancialForm(true)}>
                        Upload Financial Document
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Bank accounts, insurance policies, financial documents, and related information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {financialDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No financial documents uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {financialDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <DollarSign className="w-5 h-5 text-teal-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => window.open(doc.file_url, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            {permissions.hasPermission('canManageFinancials') && (
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => handleDeleteDocument(doc.id, doc.file_url || '')}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'contacts' && (
              <Card className="border-t-4 border-rose-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-rose-500" />
                      <CardTitle>Contacts</CardTitle>
                    </div>
                    {permissions.hasPermission('canManageContacts') && (
                      <Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={() => setShowContactForm(true)}>
                        Add Contact
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Friends, relatives, and important people in the patient&apos;s life
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No contacts added</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {contacts.map(contact => (
                        <div key={contact.id} className="p-4 border rounded-lg bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                <p className="font-medium">{contact.name}</p>
                                {contact.relationship && (
                                  <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded">{contact.relationship}</span>
                                )}
                              </div>
                            </div>
                            {permissions.hasPermission('canManageContacts') && (
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => handleDeleteContact(contact.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div className="mt-3 space-y-1">
                            {contact.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="w-3 h-3" /> {contact.phone}
                              </p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <UserCircle className="w-3 h-3" /> {contact.email}
                              </p>
                            )}
                          </div>
                          {contact.is_primary && (
                            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">Primary Contact</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Patient Form Modal */}
      {showPatientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowPatientForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Patient Email *</Label>
                  <Input
                    type="email"
                    value={patientForm.patient_email}
                    onChange={(e) => setPatientForm({ ...patientForm, patient_email: e.target.value })}
                    placeholder="patient@example.com"
                  />
                </div>
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Diagnosis</Label>
                  <div className="relative">
                    <Input
                      value={patientForm.diagnosis}
                      onChange={(e) => {
                        const value = e.target.value
                        setPatientForm({ ...patientForm, diagnosis: value })
                        if (value.length > 0) {
                          const filtered = commonDiagnoses.filter(d => d.toLowerCase().includes(value.toLowerCase()))
                          setDiagnosisSuggestions(filtered)
                          setShowDiagnosisSuggestions(filtered.length > 0)
                        } else {
                          setShowDiagnosisSuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        if (patientForm.diagnosis.length > 0) {
                          const filtered = commonDiagnoses.filter(d => d.toLowerCase().includes(patientForm.diagnosis.toLowerCase()))
                          if (filtered.length > 0) {
                            setDiagnosisSuggestions(filtered)
                            setShowDiagnosisSuggestions(true)
                          }
                        }
                      }}
                      onBlur={() => { setTimeout(() => setShowDiagnosisSuggestions(false), 200) }}
                      placeholder="Primary diagnosis"
                    />
                    {showDiagnosisSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {diagnosisSuggestions.map((diagnosis, index) => (
                          <button key={index} type="button" className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                            onClick={() => { setPatientForm({ ...patientForm, diagnosis }); setShowDiagnosisSuggestions(false) }}>
                            {diagnosis}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={patientForm.emergency_contact_name}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })}
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <select
                    value={patientForm.emergency_contact_relationship}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_relationship: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Caregiver">Caregiver</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>Allergies</Label>
                  <Input
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                    placeholder="Penicillin, Peanuts, etc."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Current Medications</Label>
                  <Textarea
                    value={patientForm.medications}
                    onChange={(e) => setPatientForm({ ...patientForm, medications: e.target.value })}
                    rows={3}
                    placeholder="List current medications"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPatientForm(false)}>Cancel</Button>
                <Button onClick={selectedPatient ? handleUpdatePatient : handleAddPatient}>
                  {selectedPatient ? 'Update' : 'Add'} Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medication Form Modal */}
      {showMedicationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Medication</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowMedicationForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Medication Name *</Label>
                <div className="relative">
                  <Input
                    value={medicationForm.name}
                    onChange={(e) => {
                      const value = e.target.value
                      setMedicationForm({ ...medicationForm, name: value })
                      if (value.length > 0) {
                        const filtered = commonMedications.filter(m => m.toLowerCase().includes(value.toLowerCase()))
                        setMedicationSuggestions(filtered)
                        setShowMedicationSuggestions(filtered.length > 0)
                      } else {
                        setShowMedicationSuggestions(false)
                      }
                    }}
                    onFocus={() => {
                      if (medicationForm.name.length > 0) {
                        const filtered = commonMedications.filter(m => m.toLowerCase().includes(medicationForm.name.toLowerCase()))
                        if (filtered.length > 0) { setMedicationSuggestions(filtered); setShowMedicationSuggestions(true) }
                      }
                    }}
                    onBlur={() => { setTimeout(() => setShowMedicationSuggestions(false), 200) }}
                    placeholder="e.g., Aspirin"
                  />
                  {showMedicationSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {medicationSuggestions.map((medication, index) => (
                        <button key={index} type="button" className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          onClick={() => { setMedicationForm({ ...medicationForm, name: medication }); setShowMedicationSuggestions(false) }}>
                          {medication}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Details (dosage, frequency, instructions)</Label>
                <Textarea value={medicationForm.details}
                  onChange={(e) => setMedicationForm({ ...medicationForm, details: e.target.value })}
                  placeholder="e.g., 100mg twice daily with food" rows={3} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={medicationForm.date}
                  onChange={(e) => setMedicationForm({ ...medicationForm, date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMedicationForm(false)}>Cancel</Button>
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleAddMedication}>Add Medication</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Care Log Form Modal */}
      {showCareLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Care Log</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCareLogForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Activity Name *</Label>
                <Input value={careLogForm.name}
                  onChange={(e) => setCareLogForm({ ...careLogForm, name: e.target.value })}
                  placeholder="e.g., Morning medication given" />
              </div>
              <div>
                <Label>Details</Label>
                <Textarea value={careLogForm.details}
                  onChange={(e) => setCareLogForm({ ...careLogForm, details: e.target.value })}
                  placeholder="Additional notes about this activity" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCareLogForm(false)}>Cancel</Button>
                <Button className="bg-purple-500 hover:bg-purple-600" onClick={handleAddCareLog}>Add Log</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Appointment</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAppointmentForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={appointmentForm.title}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                  placeholder="Doctor's appointment" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                  placeholder="Additional details" rows={2} />
              </div>
              <div>
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={appointmentForm.appointmentDate}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={appointmentForm.location}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
                  placeholder="Hospital, clinic address" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAppointmentForm(false)}>Cancel</Button>
                <Button className="bg-green-500 hover:bg-green-600" onClick={handleAddAppointment}>Add Appointment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Upload Form Modal */}
      {showDocumentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Document</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowDocumentForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Document Name *</Label>
                <Input value={documentForm.name}
                  onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                  placeholder="e.g., Medical Report" />
              </div>
              <div>
                <Label>Category</Label>
                <select value={documentForm.category}
                  onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value as DocumentCategory })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="medical">Medical</option>
                  <option value="legal">Legal</option>
                  <option value="identification">Identification</option>
                </select>
              </div>
              <div>
                <Label>File *</Label>
                <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDocumentForm(false)}>Cancel</Button>
                <Button className="bg-orange-500 hover:bg-orange-600"
                  onClick={handleUploadDocument}
                  disabled={uploadingFile || !selectedFile || !documentForm.name}>
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Contact</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowContactForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Contact's full name" />
              </div>
              <div>
                <Label>Relationship</Label>
                <select value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Neighbor">Neighbor</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Caregiver">Caregiver</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="contact@example.com" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={contactForm.is_primary}
                  onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                  className="w-4 h-4" />
                <Label htmlFor="isPrimary">Primary Contact</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowContactForm(false)}>Cancel</Button>
                <Button className="bg-rose-500 hover:bg-rose-600" onClick={handleAddContact}>Add Contact</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Document Upload Modal */}
      {showFinancialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Financial Document</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowFinancialForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Document Name *</Label>
                <Input value={financialForm.name}
                  onChange={(e) => setFinancialForm({ ...financialForm, name: e.target.value })}
                  placeholder="e.g., Bank Statement, Insurance Policy" />
              </div>
              <div>
                <Label>File *</Label>
                <Input type="file" onChange={(e) => setSelectedFinancialFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFinancialForm(false)}>Cancel</Button>
                <Button className="bg-teal-500 hover:bg-teal-600"
                  onClick={handleUploadFinancial}
                  disabled={uploadingFile || !selectedFinancialFile || !financialForm.name}>
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Summary Modal */}
      {showEmergencySummary && selectedPatient && (
        <EmergencySummary
          patient={selectedPatient}
          medications={medications}
          onClose={() => setShowEmergencySummary(false)}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowProfileModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{userProfile?.full_name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-base capitalize">
                    {userRole === 'caregiver' ? 'Caregiver' : 'Patient (Read-Only)'}
                  </p>
                </div>
                {userProfile?.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base">{userProfile.phone}</p>
                  </div>
                )}
                {userRole === 'caregiver' && patients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Managing Patients</p>
                    <p className="text-base">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {userRole === 'patient' && selectedPatient && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Care Information</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">You are receiving care through CareVault</p>
                      {selectedPatient.diagnosis && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Diagnosis:</span> {selectedPatient.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => setShowProfileModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <CaregiverDashboard />
    </ProtectedRoute>
  )
}
