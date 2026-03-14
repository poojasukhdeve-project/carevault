'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { User, Users, Heart, Shield, Trash2, Search, X, Calendar, Mail, Phone, ArrowLeft, LogOut, UserCircle } from 'lucide-react'
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { careRecipientService } from '@/lib/supabase-service'
import type { CareRecipient } from '@/types/supabase'

function PatientsListPage() {
  const { user, userRole } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  
  const [patients, setPatients] = useState<CareRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDiagnosis, setFilterDiagnosis] = useState<string>('')

  useEffect(() => {
    if (!user || !permissions.isCaregiver) {
      router.push('/dashboard')
      return
    }

    const loadPatients = async () => {
      const careRecipients = await careRecipientService.getCareRecipientsByCaregiver(user.id)
      setPatients(careRecipients)
      setLoading(false)
    }

    loadPatients()
  }, [user, permissions.isCaregiver, router])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchQuery === '' || 
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patient_email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDiagnosis = filterDiagnosis === '' || 
      patient.diagnosis?.toLowerCase().includes(filterDiagnosis.toLowerCase())
    
    return matchesSearch && matchesDiagnosis
  })

  const uniqueDiagnoses = Array.from(new Set(patients.map(p => p.diagnosis).filter(Boolean))) as string[]

  const clearFilters = () => {
    setSearchQuery('')
    setFilterDiagnosis('')
  }

  const handleViewPatient = (patientId: string) => {
    router.push(`/dashboard?patient=${patientId}`)
  }

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All associated data will be removed.`)) {
      return
    }

    try {
      await careRecipientService.deleteCareRecipient(id)
      setPatients(patients.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Failed to delete patient')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading patients...</p>
      </div>
    )
  }

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
                  <p className="text-xs text-muted-foreground">Patients List</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
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
        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterDiagnosis}
                  onChange={(e) => setFilterDiagnosis(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  <option value="">All Diagnoses</option>
                  {uniqueDiagnoses.map(diagnosis => (
                    <option key={diagnosis} value={diagnosis}>{diagnosis}</option>
                  ))}
                </select>
                
                {(searchQuery || filterDiagnosis) && (
                  <Button variant="outline" size="icon" onClick={clearFilters}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {(searchQuery || filterDiagnosis) && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredPatients.length} of {patients.length} patients
                {searchQuery && ` matching "${searchQuery}"`}
                {filterDiagnosis && ` with diagnosis "${filterDiagnosis}"`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patients Grid */}
        {filteredPatients.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">
                {patients.length === 0 ? 'No Patients Yet' : 'No Matching Patients'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {patients.length === 0 
                  ? 'Add your first patient to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {(searchQuery || filterDiagnosis) && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map(patient => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <CardDescription>
                          Born: {new Date(patient.date_of_birth).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.diagnosis && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {patient.diagnosis}
                      </span>
                    </div>
                  )}
                  
                  {patient.patient_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{patient.patient_email}</span>
                    </div>
                  )}
                  
                  {patient.emergency_contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{patient.emergency_contact_phone}</span>
                      {patient.emergency_contact_name && (
                        <span className="text-xs">({patient.emergency_contact_name})</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePatient(patient.id, `${patient.first_name} ${patient.last_name}`)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ProtectedPatientsPage() {
  return (
    <ProtectedRoute>
      <PatientsListPage />
    </ProtectedRoute>
  )
}
