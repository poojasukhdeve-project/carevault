# CareVault

A comprehensive healthcare management application designed for caregivers managing patients with chronic conditions.

## Overview

CareVault helps caregivers efficiently manage care recipients' medical information, medications, appointments, documents, financial records, and social contacts in one secure platform. Built with role-based access control and strict data isolation.

---

## Key Features

- **Multi-User Roles** - Caregiver (full CRUD) and Patient (read-only) access levels
- **Care Recipient Management** - One caregiver manages multiple patients with search and filter
- **Medication Tracking** - Timeline visualization with autocomplete, dosage, and instructions
- **Appointment Scheduling** - Calendar view with color-coded urgency alerts (red/yellow/blue)
- **Document Storage** - Upload and categorize medical, legal, and identification documents
- **Financial Records** - Dedicated section for bank statements, insurance policies, and financial documents
- **Contacts Management** - Track friends, relatives, and important people in the patient's life
- **Care Logs** - Line-by-line activity table with timestamps
- **Emergency Summary** - One-click PDF generation with critical patient information
- **Data Isolation** - Row Level Security (RLS) for strict access control

## Dashboard Navigation

The dashboard uses six color-coded square icon tiles as the primary navigation:

| Tile | Color | Function |
|------|-------|----------|
| Medications | Blue | View medication timeline, add/search medications |
| Appointments | Green | View/manage appointments, urgency alerts |
| Documents | Orange | Upload/download medical and legal documents |
| Care Logs | Purple | Line-by-line activity log with timestamps |
| Financial | Teal | Upload/manage financial documents |
| Contacts | Rose | Manage friends, relatives, and contacts |

Each tile displays a count of items and expands to show the full section when clicked.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| UI / Styling | Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Vercel |

---

## Project Structure

```
caregiver_app_project/
├── app/
│   ├── dashboard/            # Main dashboard with 6 section tiles
│   ├── patients/             # Patient list with search and filter
│   ├── calendar/             # Monthly calendar view
│   ├── login/                # Authentication page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── EmergencySummary.tsx  # Emergency PDF generator
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── hooks/
│   └── usePermissions.ts     # Role-based permission hook
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── supabase-service.ts   # Database service layer
│   ├── permissions.ts        # Permission configuration
│   └── utils.ts
├── types/
│   └── supabase.ts           # TypeScript type definitions
├── database/
│   └── CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql
├── docs/
│   ├── CareVault_Complete_Documentation.md
│   ├── Deployment.md
│   └── TEST_REPORT.md
└── package.json
```

---

## Quick Start

### Requirements

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository

```bash
git clone https://github.com/xtp111/CareVault.git
cd caregiver_app_project
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Initialize database

- Login to [Supabase Dashboard](https://supabase.com/dashboard)
- Go to SQL Editor
- Execute all contents from `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`

5. Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Database Architecture

### Core Tables

| Table | Purpose |
|-------|---------|
| users | User accounts linked to Supabase Auth |
| care_recipients | Patient information (core entity) |
| medical_records | Medications, conditions, care logs |
| appointments | Scheduled appointments |
| documents | Uploaded files (medical, legal, financial, identification) |
| emergency_contacts | Friends, relatives, and contacts |

### Data Isolation

- Row Level Security (RLS) enforces multi-user data isolation at the database level
- Caregivers can only access their own care recipients' data
- Patients have read-only access to their linked records

---

## User Roles and Permissions

| Permission | Caregiver | Patient |
|------------|-----------|---------|
| View patient info | Yes | Yes |
| Edit patient info | Yes | No |
| Manage medications | Yes | No |
| Manage appointments | Yes | No |
| Upload/delete documents | Yes | No |
| Manage financial docs | Yes | No |
| Manage contacts | Yes | No |
| Add/delete care logs | Yes | No |
| View emergency summary | Yes | Yes |
| Export emergency PDF | Yes | Yes |

---

## Development

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

### Service Layer

All database operations go through the service layer in `lib/supabase-service.ts`:

- `userService` - User account operations
- `careRecipientService` - Patient CRUD operations
- `medicalRecordService` - Medications and care logs
- `appointmentService` - Appointment management
- `documentService` - Document upload/download/delete
- `emergencyContactService` - Contact management

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Manual

```bash
npm run build
npm run start
```

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/CareVault_Complete_Documentation.md` | Full application documentation |
| `docs/Deployment.md` | Deployment guide |
| `docs/TEST_REPORT.md` | Test report (use case, state transition, combination, unit tests) |

---

## License

MIT License

## Contributing

Issues and Pull Requests are welcome.
