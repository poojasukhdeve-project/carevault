# CareVault API Documentation

## 1. Introduction

CareVault uses Supabase as its backend service, which provides a RESTful API for database operations. The API leverages PostgreSQL with Row Level Security (RLS) to ensure proper access controls. All API operations are performed through the Supabase client library.

## 2. Authentication

### 2.1 API Access
All API requests require authentication through Supabase's built-in authentication system. The application uses JWT tokens for session management.

### 2.2 Session Management
- Sessions are maintained client-side using cookies
- Tokens automatically refresh when near expiration
- Session timeouts occur after 30 minutes of inactivity

## 3. Base URL
```
https://[project-ref].supabase.co/rest/v1/
```

## 4. Common Headers
```
Authorization: Bearer [JWT_TOKEN]
apikey: [PROJECT_ANON_KEY]
Content-Type: application/json
```

## 5. API Endpoints

### 5.1 User Management

#### 5.1.1 Get User Profile
- **Method**: GET
- **Endpoint**: `/users`
- **Description**: Retrieves the current user's profile information
- **Headers**: Authorization
- **Query Parameters**: 
  - `id=eq.{userId}` - Filter by user ID
  - `select=*` - Select all fields
- **Response**:
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "phone": "string",
  "role": "caregiver|patient|admin",
  "pending_caregiver_email": "string",
  "pending_caregiver_name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### 5.1.2 Update User Profile
- **Method**: PATCH
- **Endpoint**: `/users`
- **Description**: Updates the current user's profile information
- **Headers**: Authorization
- **Body**:
```json
{
  "full_name": "string",
  "phone": "string",
  "role": "caregiver|patient|admin"
}
```
- **Query Parameters**: `id=eq.{userId}`
- **Response**: Updated user object

### 5.2 Care Recipient Management

#### 5.2.1 Get Care Recipients
- **Method**: GET
- **Endpoint**: `/care_recipients`
- **Description**: Retrieves care recipients managed by the current caregiver
- **Headers**: Authorization
- **Query Parameters**:
  - `caregiver_id=eq.{userId}` - Filter by caregiver ID
  - `is_active=eq.true` - Only active care recipients
  - `order=created_at.desc` - Sort by creation date
- **Response**:
```json
[
  {
    "id": "string",
    "caregiver_id": "string",
    "first_name": "string",
    "last_name": "string",
    "date_of_birth": "date",
    "relationship": "string",
    "photo_url": "string",
    "notes": "string",
    "diagnosis": "string",
    "medications": "string",
    "allergies": "string",
    "emergency_contact_name": "string",
    "emergency_contact_phone": "string",
    "emergency_contact_relationship": "string",
    "is_active": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### 5.2.2 Get Care Recipient by Email (Patient Access)
- **Method**: GET
- **Endpoint**: `/care_recipients`
- **Description**: Retrieves a care recipient by patient email (for patient users)
- **Headers**: Authorization
- **Query Parameters**:
  - `patient_email=eq.{email}` - Filter by patient email
  - `is_active=eq.true` - Only active care recipients
- **Response**: Single care recipient object

#### 5.2.3 Create Care Recipient
- **Method**: POST
- **Endpoint**: `/care_recipients`
- **Description**: Creates a new care recipient profile
- **Headers**: Authorization
- **Body**:
```json
{
  "caregiver_id": "string",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "date",
  "relationship": "string",
  "photo_url": "string",
  "notes": "string",
  "diagnosis": "string",
  "medications": "string",
  "allergies": "string",
  "emergency_contact_name": "string",
  "emergency_contact_phone": "string",
  "emergency_contact_relationship": "string",
  "is_active": "boolean"
}
```
- **Response**: Created care recipient object with ID

#### 5.2.4 Update Care Recipient
- **Method**: PATCH
- **Endpoint**: `/care_recipients`
- **Description**: Updates an existing care recipient profile
- **Headers**: Authorization
- **Body**: Partial care recipient object
- **Query Parameters**: `id=eq.{recipientId}`
- **Response**: Updated care recipient object

#### 5.2.5 Delete Care Recipient
- **Method**: DELETE
- **Endpoint**: `/care_recipients`
- **Description**: Deactivates a care recipient profile
- **Headers**: Authorization
- **Query Parameters**: `id=eq.{recipientId}`
- **Response**: Success confirmation

### 5.3 Medical Record Management

#### 5.3.1 Get Medical Records
- **Method**: GET
- **Endpoint**: `/medical_records`
- **Description**: Retrieves medical records for a specific care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}` - Filter by care recipient ID
  - `order=date.desc` - Sort by date
- **Response**:
```json
[
  {
    "id": "string",
    "care_recipient_id": "string",
    "type": "medications|conditions|doctors",
    "name": "string",
    "details": "string",
    "date": "date",
    "is_active": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### 5.3.2 Get Medical Records by Type
- **Method**: GET
- **Endpoint**: `/medical_records`
- **Description**: Retrieves medical records filtered by type
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `type=eq.{type}` - Filter by record type
  - `order=date.desc`
- **Response**: Array of medical records

#### 5.3.3 Get Active Medications
- **Method**: GET
- **Endpoint**: `/medical_records`
- **Description**: Retrieves active medications for a care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `type=eq.medication`
  - `is_active=eq.true`
  - `order=date.desc`
- **Response**: Array of medication records

#### 5.3.4 Create Medical Record
- **Method**: POST
- **Endpoint**: `/medical_records`
- **Description**: Creates a new medical record
- **Headers**: Authorization
- **Body**:
```json
{
  "care_recipient_id": "string",
  "type": "medications|conditions|doctors",
  "name": "string",
  "details": "string",
  "date": "date",
  "is_active": "boolean"
}
```
- **Response**: Created medical record object with ID

#### 5.3.5 Update Medical Record
- **Method**: PATCH
- **Endpoint**: `/medical_records`
- **Description**: Updates an existing medical record
- **Headers**: Authorization
- **Body**: Partial medical record object
- **Query Parameters**: `id=eq.{recordId}`
- **Response**: Updated medical record object

#### 5.3.6 Delete Medical Record
- **Method**: DELETE
- **Endpoint**: `/medical_records`
- **Description**: Deletes a medical record
- **Headers**: Authorization
- **Query Parameters**: `id=eq.{recordId}`
- **Response**: Success confirmation

### 5.4 Appointment Management

#### 5.4.1 Get All Appointments
- **Method**: GET
- **Endpoint**: `/appointments`
- **Description**: Retrieves all appointments with sorting
- **Headers**: Authorization
- **Query Parameters**:
  - `order=appointment_date.asc` - Sort by appointment date
- **Response**:
```json
[
  {
    "id": "string",
    "care_recipient_id": "string",
    "title": "string",
    "description": "string",
    "appointment_date": "datetime",
    "remind_before_minutes": "integer",
    "repeat_interval": "none|daily|weekly|monthly|yearly",
    "is_completed": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### 5.4.2 Get Appointments for Care Recipient
- **Method**: GET
- **Endpoint**: `/appointments`
- **Description**: Retrieves appointments for a specific care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `order=appointment_date.asc`
- **Response**: Array of appointment objects

#### 5.4.3 Get Upcoming Appointments
- **Method**: GET
- **Endpoint**: `/appointments`
- **Description**: Retrieves upcoming appointments for a care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `appointment_date=gte.now()`
  - `status=eq.scheduled`
  - `order=appointment_date.asc`
- **Response**: Array of upcoming appointment objects

#### 5.4.4 Create Appointment
- **Method**: POST
- **Endpoint**: `/appointments`
- **Description**: Creates a new appointment
- **Headers**: Authorization
- **Body**:
```json
{
  "care_recipient_id": "string",
  "title": "string",
  "description": "string",
  "appointment_date": "datetime",
  "location": "string",
  "doctor_name": "string",
  "status": "scheduled|completed|cancelled|rescheduled",
  "notes": "string"
}
```
- **Response**: Created appointment object with ID

#### 5.4.5 Update Appointment
- **Method**: PATCH
- **Endpoint**: `/appointments`
- **Description**: Updates an existing appointment
- **Headers**: Authorization
- **Body**: Partial appointment object
- **Query Parameters**: `id=eq.{appointmentId}`
- **Response**: Updated appointment object

#### 5.4.6 Delete Appointment
- **Method**: DELETE
- **Endpoint**: `/appointments`
- **Description**: Deletes an appointment
- **Headers**: Authorization
- **Query Parameters**: `id=eq.{appointmentId}`
- **Response**: Success confirmation

### 5.5 Document Management

#### 5.5.1 Get Documents
- **Method**: GET
- **Endpoint**: `/documents`
- **Description**: Retrieves documents for a specific care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `order=created_at.desc`
- **Response**:
```json
[
  {
    "id": "string",
    "care_recipient_id": "string",
    "name": "string",
    "category": "legal|medical|financial|identification",
    "file_url": "string",
    "file_name": "string",
    "file_size": "integer",
    "date": "date",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### 5.5.2 Get Documents by Category
- **Method**: GET
- **Endpoint**: `/documents`
- **Description**: Retrieves documents filtered by category
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `category=eq.{category}`
  - `order=created_at.desc`
- **Response**: Array of document objects

#### 5.5.3 Upload Document
- **Method**: POST to Supabase Storage
- **Endpoint**: `/storage/v1/object/documents/{filename}`
- **Description**: Uploads a document file to storage
- **Headers**: Authorization, Content-Type: multipart/form-data
- **Body**: File content
- **Response**: Upload confirmation

After successful upload, create document record using POST to `/documents` endpoint with metadata.

#### 5.5.4 Delete Document
- **Method**: DELETE
- **Endpoint**: `/documents` and `/storage/v1/object/documents/{filepath}`
- **Description**: Deletes document metadata and file
- **Headers**: Authorization
- **Query Parameters**: `id=eq.{documentId}`
- **Response**: Success confirmation

### 5.6 Emergency Contact Management

#### 5.6.1 Get Emergency Contacts
- **Method**: GET
- **Endpoint**: `/emergency_contacts`
- **Description**: Retrieves emergency contacts for a care recipient
- **Headers**: Authorization
- **Query Parameters**:
  - `care_recipient_id=eq.{recipientId}`
  - `order=is_primary.desc,name.asc` - Primary contacts first
- **Response**:
```json
[
  {
    "id": "string",
    "care_recipient_id": "string",
    "name": "string",
    "relationship": "string",
    "phone": "string",
    "email": "string",
    "is_primary": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### 5.6.2 Create Emergency Contact
- **Method**: POST
- **Endpoint**: `/emergency_contacts`
- **Description**: Creates a new emergency contact
- **Headers**: Authorization
- **Body**:
```json
{
  "care_recipient_id": "string",
  "name": "string",
  "relationship": "string",
  "phone": "string",
  "email": "string",
  "is_primary": "boolean"
}
```
- **Response**: Created emergency contact object with ID

#### 5.6.3 Update Emergency Contact
- **Method**: PATCH
- **Endpoint**: `/emergency_contacts`
- **Description**: Updates an existing emergency contact
- **Headers**: Authorization
- **Body**: Partial emergency contact object
- **Query Parameters**: `id=eq.{contactId}`
- **Response**: Updated emergency contact object

#### 5.6.4 Delete Emergency Contact
- **Method**: DELETE
- **Endpoint**: `/emergency_contacts`
- **Description**: Deletes an emergency contact
- **Headers**: Authorization
- **Query Parameters**: `id=eq.{contactId}`
- **Response**: Success confirmation

## 6. Database Functions

### 6.1 Get Upcoming Appointments
- **Function**: `get_upcoming_appointments(patient_id uuid, days_ahead integer DEFAULT 7)`
- **Description**: Returns upcoming appointments for a patient within specified days
- **Parameters**:
  - `patient_id`: UUID of the care recipient
  - `days_ahead`: Number of days to look ahead (default 7)
- **Returns**: Table with appointment details and days until

### 6.2 Generate Emergency Summary
- **Function**: `generate_emergency_summary(patient_id uuid)`
- **Description**: Generates a comprehensive emergency summary
- **Parameters**:
  - `patient_id`: UUID of the care recipient
- **Returns**: JSON object with patient info, emergency contacts, medications, and conditions

## 7. Error Handling

### 7.1 Standard Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

### 7.2 Common Error Codes
- `401 Unauthorized`: Invalid or expired session
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Requested resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Unexpected server error

## 8. Rate Limiting
- API requests are subject to rate limiting based on Supabase plan
- Anonymous key requests are limited to prevent abuse
- Excessive requests may result in temporary blocks

## 9. Security Considerations

### 9.1 Row Level Security
- All database operations are governed by RLS policies
- Users can only access data they own or have explicit permissions for
- Caregivers can only access their managed care recipients' data
- Patients have read-only access to their own information

### 9.2 Data Encryption
- All data in transit is encrypted using TLS
- All data at rest is encrypted by Supabase
- File storage is encrypted with access controls

## 10. API Best Practices

### 10.1 Query Optimization
- Use specific filters to minimize data transfer
- Leverage indexing by using indexed columns in WHERE clauses
- Limit results with range filters when appropriate

### 10.2 Client Implementation
- Handle authentication errors gracefully
- Implement retry logic for failed requests
- Cache responses appropriately to reduce API calls
- Validate inputs before sending requests