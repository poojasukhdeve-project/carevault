# CareVault Database Design

## 1. Introduction

This document describes the database schema for CareVault, a medical information management system for chronic disease patients and their caregivers. The database is built on PostgreSQL and utilizes Supabase for authentication and real-time features.

## 2. Database Overview

### 2.1 Database System
- **Database**: PostgreSQL (managed by Supabase)
- **Authentication**: Supabase Auth (separate schema)
- **Storage**: Supabase Storage for file management
- **Security**: Row Level Security (RLS) for data isolation

### 2.2 Design Principles
- **Normalization**: Follow 3NF principles to reduce data redundancy
- **Security**: Implement RLS for role-based data access control
- **Scalability**: Optimize for growth with proper indexing
- **Integrity**: Use foreign key constraints and check constraints
- **Audit Trail**: Maintain created_at and updated_at timestamps

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
users (one-to-many) ←→ care_recipients (one-to-many) ←→ medical_records
                         ↓                                    ↓
                    appointments ←→ documents ←→ emergency_contacts
```

### 3.2 Tables Description

#### 3.2.1 users Table
Stores user account information and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User ID linked to Supabase Auth |
| full_name | TEXT | NOT NULL | User's full name |
| phone | TEXT | | Phone number |
| role | TEXT | NOT NULL, DEFAULT 'caregiver', CHECK (role IN ('caregiver', 'patient', 'admin')) | User role |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_users_role` on `role` column

**Comments**:
- Links to Supabase Auth system via foreign key constraint
- Role determines user permissions in the application

#### 3.2.2 care_recipients Table
Core entity representing care recipients/patients managed by caregivers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for care recipient |
| caregiver_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | ID of the caregiver managing this recipient |
| first_name | TEXT | NOT NULL | First name of the care recipient |
| last_name | TEXT | NOT NULL | Last name of the care recipient |
| date_of_birth | DATE | | Date of birth |
| relationship | TEXT | | Relationship to caregiver |
| photo_url | TEXT | | URL to photo |
| notes | TEXT | | Additional notes |
| diagnosis | TEXT | | Medical diagnosis |
| medications | TEXT | | Current medications overview |
| allergies | TEXT | | Allergy information |
| emergency_contact_name | TEXT | | Emergency contact name |
| emergency_contact_phone | TEXT | | Emergency contact phone |
| emergency_contact_relationship | TEXT | | Relationship to emergency contact |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_care_recipients_caregiver` on `caregiver_id`
- `idx_care_recipients_active` on `is_active`
- `idx_care_recipients_created_at` on `created_at DESC`

**Comments**:
- Core entity of the system
- Each record is linked to a caregiver via foreign key
- Soft delete implemented with `is_active` flag

#### 3.2.3 medical_records Table
Stores various types of medical records for care recipients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the medical record |
| care_recipient_id | UUID | NOT NULL, REFERENCES care_recipients(id) ON DELETE CASCADE | ID of the care recipient |
| type | TEXT | NOT NULL, CHECK (type IN ('medications', 'conditions', 'doctors')) | Type of medical record |
| name | TEXT | NOT NULL | Name/title of the record |
| details | TEXT | | Detailed information |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Date of the record |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_medical_records_recipient` on `care_recipient_id`
- `idx_medical_records_type` on `type`
- `idx_medical_records_date` on `date DESC`

**Comments**:
- Supports different types of medical records
- Linked to care recipients via foreign key

#### 3.2.4 appointments Table
Manages appointments and reminders for care recipients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the appointment |
| care_recipient_id | UUID | NOT NULL, REFERENCES care_recipients(id) ON DELETE CASCADE | ID of the care recipient |
| title | TEXT | NOT NULL | Appointment title |
| description | TEXT | | Appointment description |
| appointment_date | TIMESTAMPTZ | NOT NULL | Scheduled appointment date and time |
| remind_before_minutes | INTEGER | DEFAULT 30 | Minutes before appointment to send reminder |
| repeat_interval | TEXT | DEFAULT 'none', CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')) | How often the appointment repeats |
| is_completed | BOOLEAN | DEFAULT false | Completion status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_appointments_recipient` on `care_recipient_id`
- `idx_appointments_date` on `appointment_date`
- `idx_appointments_completed` on `is_completed`

**Comments**:
- Supports recurring appointments
- Tracks completion status

#### 3.2.5 documents Table
Manages document storage for care recipients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the document |
| care_recipient_id | UUID | NOT NULL, REFERENCES care_recipients(id) ON DELETE CASCADE | ID of the care recipient |
| name | TEXT | NOT NULL | Document name |
| category | TEXT | NOT NULL, CHECK (category IN ('legal', 'medical', 'financial', 'identification')) | Document category |
| file_url | TEXT | | Public URL of the file |
| file_name | TEXT | | Original file name |
| file_size | INTEGER | | File size in bytes |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Date associated with the document |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_documents_recipient` on `care_recipient_id`
- `idx_documents_category` on `category`
- `idx_documents_date` on `date DESC`

**Comments**:
- Stores metadata; actual files in Supabase Storage
- Categorized for easy organization

#### 3.2.6 emergency_contacts Table
Manages emergency contact information for care recipients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the contact |
| care_recipient_id | UUID | REFERENCES care_recipients(id) ON DELETE CASCADE | ID of the care recipient |
| name | TEXT | NOT NULL | Contact name |
| relationship | TEXT | | Relationship to care recipient |
| phone | TEXT | | Contact phone number |
| email | TEXT | | Contact email |
| is_primary | BOOLEAN | DEFAULT false | Primary contact indicator |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_emergency_contacts_recipient` on `care_recipient_id`
- `idx_emergency_contacts_primary` on `is_primary`

**Comments**:
- Supports multiple emergency contacts per care recipient
- Primary contact designation for quick reference

## 4. Security Implementation

### 4.1 Row Level Security (RLS)

RLS policies are implemented to ensure data isolation:

#### 4.1.1 users Table Policies
- **View Own Profile**: Users can view their own profile
- **Update Own Profile**: Users can update their own profile
- **Insert Own Profile**: Users can insert their own profile

#### 4.1.2 care_recipients Table Policies
- **View Own Patients**: Caregivers can view patients they manage
- **Insert Own Patients**: Caregivers can add patients they manage
- **Update Own Patients**: Caregivers can update patients they manage
- **Delete Own Patients**: Caregivers can delete patients they manage

#### 4.1.3 Related Data Policies
- **Medical Records**: Access controlled by care recipient ownership
- **Appointments**: Access controlled by care recipient ownership
- **Documents**: Access controlled by care recipient ownership
- **Emergency Contacts**: Access controlled by care recipient ownership

### 4.2 Storage Security
- **Upload Policy**: Authenticated users can upload to documents bucket
- **View Policy**: Authenticated users can view documents in bucket
- **Update Policy**: Authenticated users can update documents in bucket
- **Delete Policy**: Authenticated users can delete documents in bucket

## 5. Database Functions and Views

### 5.1 Custom Functions

#### 5.1.1 get_upcoming_appointments(patient_id uuid, days_ahead integer DEFAULT 7)
Returns upcoming appointments for a care recipient within a specified number of days.

**Parameters**:
- `patient_id`: UUID of the care recipient
- `days_ahead`: Number of days to look ahead (default 7)

**Returns**: Table with appointment details and days until appointment

#### 5.1.2 generate_emergency_summary(patient_id uuid)
Generates a comprehensive emergency summary for a care recipient.

**Parameters**:
- `patient_id`: UUID of the care recipient

**Returns**: JSON object containing patient info, emergency contacts, medications, and conditions

### 5.2 Views

#### 5.2.1 patient_overview View
Provides a comprehensive overview of care recipients with aggregated statistics.

**Columns**:
- Care recipient details
- Age calculation
- Count of medications
- Count of upcoming appointments
- Count of documents
- Status and timestamps

## 6. Triggers and Automation

### 6.1 Update Timestamp Trigger
A trigger function `update_updated_at_column()` is applied to all tables to automatically update the `updated_at` field before any UPDATE operation.

### 6.2 Trigger Applications
- Applied to: `users`, `care_recipients`, `medical_records`, `appointments`, `documents`, `emergency_contacts`

## 7. Indexing Strategy

### 7.1 Primary Indexes
- All primary keys are automatically indexed
- Foreign key columns are indexed for join performance
- Frequently queried columns are indexed

### 7.2 Performance Indexes
- Created_at indexes with descending order for recent data queries
- Composite indexes for multi-column queries where appropriate
- Category and status indexes for filtering operations

## 8. Storage Configuration

### 8.1 Storage Buckets
- **Bucket Name**: `documents`
- **Public Access**: Enabled for document sharing
- **Policy**: Authenticated user access control

### 8.2 File Handling
- Files uploaded to Supabase Storage
- Metadata stored in `documents` table
- Public URLs generated for sharing access

## 9. Data Relationships

### 9.1 Referential Integrity
- Foreign key constraints ensure data consistency
- CASCADE delete removes related records
- Proper normalization reduces data redundancy

### 9.2 Relationship Mapping
- One user (caregiver) to many care recipients
- One care recipient to many medical records
- One care recipient to many appointments
- One care recipient to many documents
- One care recipient to many emergency contacts

## 10. Migration and Versioning

### 10.1 Schema Evolution
The schema has evolved through multiple iterations to address issues:
- Removed redundant fields like `name` from care_recipients
- Fixed foreign key relationships
- Implemented proper RLS policies
- Added proper indexing strategy

### 10.2 Backup Strategy
- Automated daily backups via Supabase
- Point-in-time recovery available
- Manual backup capability for critical updates

## 11. Performance Considerations

### 11.1 Query Optimization
- Proper indexing strategy implemented
- Efficient JOIN operations
- Minimized data transfer with selective field selection

### 11.2 Scalability Factors
- UUID primary keys for distributed systems
- Proper partitioning for large datasets
- Connection pooling managed by Supabase