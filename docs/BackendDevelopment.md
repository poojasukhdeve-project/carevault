# CareVault Backend Development Guide

## 1. Introduction

This document provides comprehensive guidance for developing and maintaining the backend of the CareVault application. The backend is built on the Supabase platform, which provides PostgreSQL database, authentication, and storage services with built-in security features.

## 2. Architecture Overview

### 2.1 Backend Components
The CareVault backend consists of:
- **Supabase PostgreSQL Database**: Primary data storage with Row Level Security
- **Supabase Authentication**: User authentication and session management
- **Supabase Storage**: File storage for documents and media
- **Database Functions**: Custom PostgreSQL functions for business logic
- **Database Views**: Aggregated data views for reporting
- **Triggers**: Automated operations for maintaining data consistency

### 2.2 Service Layer Architecture
The application implements a service layer pattern in `lib/supabase-service.ts` that abstracts direct database interactions:

```
Frontend Components
         ↓
Service Layer (supabase-service.ts)
         ↓
Supabase Client Library
         ↓
PostgreSQL Database + RLS Policies
```

## 3. Database Schema

### 3.1 Core Tables

#### 3.1.1 users Table
This table extends Supabase's built-in auth.users table with application-specific fields:

```sql
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'caregiver' CHECK (role IN ('caregiver', 'patient', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores application-specific user information linked to Supabase Auth.

#### 3.1.2 care_recipients Table
The central entity representing patients/care recipients:

```sql
CREATE TABLE care_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  relationship text,
  photo_url text,
  notes text,
  diagnosis text,
  medications text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Core entity linking caregivers to care recipients.

#### 3.1.3 medical_records Table
Stores various types of medical information:

```sql
CREATE TABLE medical_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('medications', 'conditions', 'doctors')),
  name text NOT NULL,
  details text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores medication, condition, and doctor visit information.

#### 3.1.4 appointments Table
Manages medical appointments and reminders:

```sql
CREATE TABLE appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  appointment_date timestamptz NOT NULL,
  remind_before_minutes integer DEFAULT 30,
  repeat_interval text DEFAULT 'none' CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Tracks medical appointments and related information.

#### 3.1.5 documents Table
Manages document metadata:

```sql
CREATE TABLE documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('legal', 'medical', 'financial', 'identification')),
  file_url text,
  file_name text,
  file_size integer,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores document metadata; actual files in Supabase Storage.

#### 3.1.6 emergency_contacts Table
Manages emergency contact information:

```sql
CREATE TABLE emergency_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores emergency contact information for care recipients.

### 3.2 Indexes

#### 3.2.1 Performance Indexes
The schema includes strategic indexes for optimal query performance:

- `idx_users_role` on users(role)
- `idx_care_recipients_caregiver` on care_recipients(caregiver_id)
- `idx_care_recipients_active` on care_recipients(is_active)
- `idx_care_recipients_created_at` on care_recipients(created_at DESC)
- `idx_medical_records_recipient` on medical_records(care_recipient_id)
- `idx_medical_records_type` on medical_records(type)
- `idx_medical_records_date` on medical_records(date DESC)
- `idx_appointments_recipient` on appointments(care_recipient_id)
- `idx_appointments_date` on appointments(appointment_date)
- `idx_appointments_completed` on appointments(is_completed)
- `idx_documents_recipient` on documents(care_recipient_id)
- `idx_documents_category` on documents(category)
- `idx_documents_date` on documents(date DESC)
- `idx_emergency_contacts_recipient` on emergency_contacts(care_recipient_id)
- `idx_emergency_contacts_primary` on emergency_contacts(is_primary)

### 3.3 Triggers

#### 3.3.1 Automatic Timestamp Updates
A trigger function ensures all tables automatically update their `updated_at` field:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to all tables
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Similar triggers for other tables...
```

## 4. Security Implementation

### 4.1 Row Level Security (RLS)

#### 4.1.1 RLS Policy Structure
The database implements comprehensive RLS policies to ensure data isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
-- etc...

-- Example policy for care_recipients
CREATE POLICY "Caregivers can view own patients" 
  ON care_recipients FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());
```

#### 4.1.2 Policy Categories

##### User Policies
- **View Own Profile**: Users can view their own profile
- **Update Own Profile**: Users can update their own profile
- **Insert Own Profile**: Users can insert their own profile

##### Care Recipient Policies
- **View Own Patients**: Caregivers can view patients they manage
- **Insert Own Patients**: Caregivers can add patients they manage
- **Update Own Patients**: Caregivers can update patients they manage
- **Delete Own Patients**: Caregivers can delete patients they manage

##### Related Data Policies
- **Medical Records**: Access controlled by care recipient ownership
- **Appointments**: Access controlled by care recipient ownership
- **Documents**: Access controlled by care recipient ownership
- **Emergency Contacts**: Access controlled by care recipient ownership

### 4.2 Storage Security
Storage buckets have dedicated RLS policies:

```sql
CREATE POLICY "Authenticated users can upload" 
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');
-- Similar policies for SELECT, UPDATE, DELETE
```

## 5. Database Functions

### 5.1 get_upcoming_appointments Function
Returns upcoming appointments within a specified timeframe:

```sql
CREATE OR REPLACE FUNCTION get_upcoming_appointments(patient_id uuid, days_ahead integer DEFAULT 7)
RETURNS TABLE (
  id uuid,
  title text,
  appointment_date timestamptz,
  days_until integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.appointment_date,
    EXTRACT(DAY FROM (a.appointment_date - now()))::integer AS days_until
  FROM appointments a
  WHERE a.care_recipient_id = patient_id
    AND a.is_completed = false
    AND a.appointment_date > now()
    AND a.appointment_date <= now() + (days_ahead || ' days')::interval
  ORDER BY a.appointment_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**:
```sql
SELECT * FROM get_upcoming_appointments('some-uuid', 7);
```

### 5.2 generate_emergency_summary Function
Creates a comprehensive emergency summary for a care recipient:

```sql
CREATE OR REPLACE FUNCTION generate_emergency_summary(patient_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'patient', json_build_object(
      'name', first_name || ' ' || last_name,
      'date_of_birth', date_of_birth,
      'age', EXTRACT(YEAR FROM age(date_of_birth)),
      'diagnosis', diagnosis,
      'allergies', allergies
    ),
    'emergency_contact', json_build_object(
      'name', emergency_contact_name,
      'phone', emergency_contact_phone,
      'relationship', emergency_contact_relationship
    ),
    'medications', (
      SELECT json_agg(json_build_object(
        'name', name,
        'details', details,
        'date', date
      ))
      FROM medical_records
      WHERE care_recipient_id = patient_id AND type = 'medications'
      ORDER BY date DESC
      LIMIT 10
    ),
    'recent_conditions', (
      SELECT json_agg(json_build_object(
        'name', name,
        'details', details,
        'date', date
      ))
      FROM medical_records
      WHERE care_recipient_id = patient_id AND type = 'conditions'
      ORDER BY date DESC
      LIMIT 5
    )
  ) INTO result
  FROM care_recipients
  WHERE id = patient_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**:
```sql
SELECT generate_emergency_summary('some-uuid');
```

## 6. Views

### 6.1 patient_overview View
Provides a comprehensive view of care recipients with aggregated statistics:

```sql
CREATE OR REPLACE VIEW patient_overview AS
SELECT 
  cr.id,
  cr.caregiver_id,
  cr.first_name || ' ' || cr.last_name AS full_name,
  cr.first_name,
  cr.last_name,
  cr.date_of_birth,
  EXTRACT(YEAR FROM age(cr.date_of_birth)) AS age,
  cr.relationship,
  cr.diagnosis,
  cr.allergies,
  cr.emergency_contact_name,
  cr.emergency_contact_phone,
  cr.emergency_contact_relationship,
  cr.is_active,
  COUNT(DISTINCT mr.id) FILTER (WHERE mr.type = 'medications') AS medication_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_completed = false AND a.appointment_date > now()) AS upcoming_appointments_count,
  COUNT(DISTINCT d.id) AS document_count,
  cr.created_at,
  cr.updated_at
FROM care_recipients cr
LEFT JOIN medical_records mr ON cr.id = mr.care_recipient_id
LEFT JOIN appointments a ON cr.id = a.care_recipient_id
LEFT JOIN documents d ON cr.id = d.care_recipient_id
GROUP BY cr.id;
```

## 7. Service Layer Implementation

### 7.1 Service Architecture
The service layer in `lib/supabase-service.ts` provides a clean abstraction over direct database queries:

```typescript
export const careRecipientService = {
  // Get all care recipients for a caregiver
  async getCareRecipientsByCaregiver(caregiverId: string): Promise<CareRecipient[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  // Get care recipient by patient email (for patient users)
  async getCareRecipientByEmail(patientEmail: string): Promise<CareRecipient | null> {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('patient_email', patientEmail)
      .eq('is_active', true)
      .single()
    return error ? null : data
  },

  // Other service methods...
}
```

### 7.2 Error Handling in Services
Services implement consistent error handling:

```typescript
export const medicalRecordService = {
  async createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data.id
  }
}
```

## 8. Authentication and Authorization

### 8.1 Supabase Authentication
The application leverages Supabase Auth for user management:

```typescript
// In lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 8.2 Role-Based Access Control
Permissions are defined in `lib/permissions.ts`:

```typescript
export type UserRole = 'patient' | 'caregiver'

export interface RolePermissions {
  canViewPatientInfo: boolean
  canEditPatientInfo: boolean
  canManageMedications: boolean
  canAddCareLogs: boolean
  canEditCareLogs: boolean
  canDeleteCareLogs: boolean
  canManageAppointments: boolean
  canUploadDocuments: boolean
  canDeleteDocuments: boolean
  canViewEmergencySummary: boolean
  canExportEmergencySummary: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  patient: {
    canViewPatientInfo: true,
    canEditPatientInfo: false,       // Read-only
    canManageMedications: false,     // Read-only
    // ... other permissions
  },
  caregiver: {
    canViewPatientInfo: true,
    canEditPatientInfo: true,        // Full access
    canManageMedications: true,      // Full access
    // ... other permissions
  }
}
```

## 9. Data Validation and Constraints

### 9.1 Database Constraints
The schema implements various constraints to maintain data integrity:

- **Check Constraints**: Validate field values (role, category, type)
- **Foreign Key Constraints**: Ensure referential integrity
- **NOT NULL Constraints**: Enforce required fields
- **UNIQUE Constraints**: Prevent duplicates where needed

### 9.2 Application-Level Validation
Additional validation occurs in the service layer and frontend components to provide better user experience.

## 10. File Storage Management

### 10.1 Document Storage Architecture
Files are stored in Supabase Storage with metadata in the database:

```typescript
export const documentService = {
  async uploadDocument(
    file: File,
    careRecipientId: string,
    metadata: Omit<DocumentRecord, 'id' | 'care_recipient_id' | 'file_url' | 'file_name' | 'file_size' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Save metadata to database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...metadata,
        care_recipient_id: careRecipientId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }
}
```

## 11. Database Maintenance

### 11.1 Schema Changes
Database schema changes are managed through SQL migration scripts located in the `database/` directory:

- `CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`: Complete schema rebuild
- Other specialized migration scripts for specific updates

### 11.2 Backup and Recovery
- Automated daily backups via Supabase
- Manual backup capability through Supabase Dashboard
- Point-in-time recovery options

### 11.3 Performance Monitoring
Monitor database performance through:
- Supabase Dashboard analytics
- Query performance metrics
- Connection pool usage

## 12. Extending Backend Functionality

### 12.1 Adding New Tables
When adding new tables, follow this pattern:

1. Add table definition to migration script
2. Create corresponding TypeScript interface in `types/supabase.ts`
3. Add service functions in `lib/supabase-service.ts`
4. Implement RLS policies
5. Add indexes for performance
6. Add triggers for automatic updates if needed

### 12.2 Adding New Functions
Custom PostgreSQL functions can be added to implement complex business logic:

1. Write function in SQL
2. Test thoroughly in development
3. Add to migration script
4. Document the function in this guide

### 12.3 Adding New Views
Views can aggregate data for reporting or complex queries:

1. Design the view query
2. Test performance with sample data
3. Add to migration script
4. Document the view purpose

## 13. Security Best Practices

### 13.1 RLS Policy Design
- Be restrictive by default
- Use parameterized policies when possible
- Test policies thoroughly
- Document all policies

### 13.2 Data Encryption
- All data is automatically encrypted by Supabase
- Use encrypted connections (TLS)
- Store sensitive information appropriately

### 13.3 Input Validation
- Validate data at multiple layers
- Use database constraints as a final check
- Implement proper error handling

## 14. Performance Optimization

### 14.1 Query Optimization
- Use proper indexing strategies
- Limit results where possible
- Use efficient JOIN operations
- Consider materialized views for complex aggregations

### 14.2 Connection Management
- Leverage Supabase's connection pooling
- Minimize unnecessary queries
- Batch operations when possible

## 15. Troubleshooting Common Issues

### 15.1 RLS Policy Issues
- Verify policies are enabled on tables
- Check policy conditions for accuracy
- Ensure users have proper roles

### 15.2 Authentication Issues
- Confirm Supabase configuration in environment variables
- Verify RLS policies allow proper access
- Check that user IDs match between auth and custom tables

### 15.3 Database Connection Issues
- Ensure proper Supabase URL and keys
- Check network connectivity
- Verify database is not overloaded

## 16. Monitoring and Observability

### 16.1 Database Metrics
Monitor key metrics through Supabase Dashboard:
- Query performance
- Connection counts
- Error rates
- Storage usage

### 16.2 Application Logs
- Database query logs
- Authentication events
- Error logs

## 17. Environment Configuration

### 17.1 Environment Variables
The backend relies on these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 17.2 Development vs Production
- Use separate Supabase projects for each environment
- Maintain consistent schema across environments
- Configure appropriate RLS policies for each environment