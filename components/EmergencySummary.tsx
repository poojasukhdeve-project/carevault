'use client'

import { AlertCircle, Download, X, Phone, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CareRecipient, MedicalRecord } from '@/types/supabase'
import jsPDF from 'jspdf'

interface EmergencySummaryProps {
  patient: CareRecipient
  medications: MedicalRecord[]
  onClose: () => void
}

export default function EmergencySummary({ patient, medications, onClose }: EmergencySummaryProps) {
  const activeMeds = medications

  const handleExportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let y = margin

    // Header - Red Emergency Banner
    pdf.setFillColor(220, 38, 38)
    pdf.rect(0, 0, pageWidth, 25, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('EMERGENCY MEDICAL SUMMARY', pageWidth / 2, 15, { align: 'center' })

    // Reset text color
    pdf.setTextColor(0, 0, 0)
    y = 35

    // Patient Information
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PATIENT INFORMATION', margin, y)
    y += 10

    pdf.setFontSize(11)
    pdf.text('Name:', margin + 5, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${patient.first_name} ${patient.last_name}`, margin + 30, y)
    y += 7

    pdf.setFont('helvetica', 'bold')
    pdf.text('DOB:', margin + 5, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(new Date(patient.date_of_birth).toLocaleDateString(), margin + 30, y)
    y += 10

    // Emergency Contact
    if (patient.emergency_contact_name) {
      pdf.setFillColor(255, 243, 205)
      pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'F')
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      y += 7
      pdf.text('EMERGENCY CONTACT', margin + 5, y)
      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(`${patient.emergency_contact_name} - ${patient.emergency_contact_phone || 'N/A'}`, margin + 5, y)
      y += 12
    }

    // Allergies
    if (patient.allergies) {
      pdf.setFillColor(254, 226, 226)
      const allergiesHeight = 25
      pdf.rect(margin, y, pageWidth - 2 * margin, allergiesHeight, 'F')
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      y += 7
      pdf.text('ALLERGIES', margin + 5, y)
      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(patient.allergies, margin + 5, y, { maxWidth: pageWidth - 2 * margin - 10 })
      y += allergiesHeight - 6
    }

    // Current Medications
    if (activeMeds.length > 0) {
      y += 5
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CURRENT MEDICATIONS', margin, y)
      y += 8

      pdf.setFontSize(10)
      activeMeds.forEach(med => {
        if (y > pageHeight - 30) {
          pdf.addPage()
          y = margin
        }
        pdf.setFont('helvetica', 'bold')
        pdf.text(`• ${med.title}`, margin + 5, y)
        y += 5
        if (med.description) {
          pdf.setFont('helvetica', 'normal')
          pdf.text(`  ${med.description}`, margin + 7, y)
          y += 5
        }
        y += 3
      })
    }

    // Diagnosis
    if (patient.diagnosis) {
      y += 5
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DIAGNOSIS', margin, y)
      y += 8
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(patient.diagnosis, margin + 5, y, { maxWidth: pageWidth - 2 * margin - 10 })
    }

    // Footer
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 10)
    pdf.text('CareVault Emergency Summary', pageWidth - margin, pageHeight - 10, { align: 'right' })

    pdf.save(`Emergency_Summary_${patient.first_name}_${patient.last_name}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Emergency Medical Summary
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-destructive-foreground hover:bg-destructive/80">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Patient</h3>
            <div>
              <p className="text-lg font-semibold">{patient.first_name} {patient.last_name}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm text-yellow-900 mb-1">Emergency Contact</h3>
                  <p className="text-lg font-semibold">{patient.emergency_contact_name}</p>
                  {patient.emergency_contact_phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      <p className="text-xl font-bold">{patient.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Allergies */}
          {patient.allergies && (
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ALLERGIES
              </h3>
              <p className="text-red-900">{patient.allergies}</p>
            </div>
          )}

          {/* Diagnosis */}
          {patient.diagnosis && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Diagnosis</h3>
              <p>{patient.diagnosis}</p>
            </div>
          )}

          {/* Current Medications */}
          {activeMeds.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Current Medications</h3>
              <div className="space-y-2">
                {activeMeds.map((med) => (
                  <div key={med.id} className="border-l-2 border-primary pl-3 py-1">
                    <p className="font-medium">{med.title}</p>
                    {med.description && <p className="text-sm text-muted-foreground">{med.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
