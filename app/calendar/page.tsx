'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Shield, ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, LogOut } from 'lucide-react'
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { appointmentService, careRecipientService } from '@/lib/supabase-service'
import type { Appointment, CareRecipient } from '@/types/supabase'

function CalendarView() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<CareRecipient[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !permissions.isCaregiver) {
      router.push('/dashboard')
      return
    }

    const loadData = async () => {
      const [appts, pts] = await Promise.all([
        appointmentService.getAllAppointments(),
        careRecipientService.getCareRecipientsByCaregiver(user.id)
      ])
      setAppointments(appts)
      setPatients(pts)
      setLoading(false)
    }

    loadData()
  }, [user, permissions.isCaregiver, router])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getAppointmentsForDay = (day: number) => {
    const dayDate = new Date(year, month, day)
    return appointments.filter(appt => {
      const apptDate = new Date(appt.appointment_date)
      return apptDate.getDate() === day &&
             apptDate.getMonth() === month &&
             apptDate.getFullYear() === year &&
             appt.status === 'scheduled'
    })
  }

  const getPatientName = (createdBy: string) => {
    const patient = patients.find(p => p.caregiver_id === createdBy)
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading calendar...</p>
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
                  <p className="text-xs text-muted-foreground">Appointment Calendar</p>
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                {monthNames[month]} {year}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-sm p-2 border-b">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-24 p-2 border rounded-lg bg-gray-50"></div>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const dayAppointments = getAppointmentsForDay(day)
                const isToday = new Date().getDate() === day &&
                               new Date().getMonth() === month &&
                               new Date().getFullYear() === year
                
                return (
                  <div
                    key={day}
                    className={`min-h-24 p-2 border rounded-lg ${
                      isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(appt => (
                        <div
                          key={appt.id}
                          className="text-xs p-1 bg-green-100 text-green-800 rounded truncate cursor-pointer hover:bg-green-200"
                          title={`${appt.title} - ${new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {new Date(appt.appointment_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} {appt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-600 pl-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upcoming appointments list */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
              <div className="space-y-2">
                {appointments
                  .filter(a => a.status === 'scheduled' && new Date(a.appointment_date) > new Date())
                  .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                  .slice(0, 10)
                  .map(appt => (
                    <div key={appt.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appt.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appt.appointment_date).toLocaleDateString()} at{' '}
                          {new Date(appt.appointment_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {appt.location && (
                          <p className="text-sm text-muted-foreground">{appt.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function ProtectedCalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarView />
    </ProtectedRoute>
  )
}
