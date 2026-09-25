# CareVault

A comprehensive healthcare management application for caregivers managing patients with chronic conditions — consolidating medical information, medications, appointments, documents, financial records, and contacts into one secure, role-based platform.

**Author:** Pooja Sukhdeve

---

## Overview

Caregivers managing a patient's chronic condition often juggle scattered information: medication schedules, appointment reminders, legal and financial documents, and emergency contacts — usually across notebooks, folders, and disconnected apps. CareVault consolidates all of it into a single platform with strict role-based access, so caregivers get full control while patients get safe, read-only visibility into their own information.

---

## Problem Statement

Managing care for someone with a chronic condition typically involves:

- Medical, legal, and financial documents scattered across different places
- No single source of truth for medications, appointments, and care history
- No safe way to give the patient visibility without giving them edit access
- Difficulty producing a quick, complete summary in an emergency

---

## Solution

CareVault addresses this with:

- A single dashboard covering medications, appointments, documents, financial records, care logs, and contacts
- Role-based access — full CRUD for Caregivers, read-only for Patients
- Row Level Security (RLS) enforced at the database level, not just in the UI
- One-click Emergency Summary PDF generation for critical information

---

## Key Features

- **Multi-User Roles** — Caregiver (full CRUD) and Patient (read-only) access levels
- **Care Recipient Management** — one caregiver manages multiple patients, with search and filter
- **Medication Tracking** — timeline visualization with autocomplete, dosage, and instructions
- **Appointment Scheduling** — calendar view with color-coded urgency alerts (red/yellow/blue)
- **Document Storage** — upload and categorize medical, legal, and identification documents
- **Financial Records** — dedicated section for bank statements, insurance policies, and financial documents
- **Contacts Management** — track friends, relatives, and important people in the patient's life
- **Care Logs** — line-by-line activity table with timestamps
- **Emergency Summary** — one-click PDF generation with critical patient information
- **Data Isolation** — Row Level Security (RLS) for strict, database-level access control

---

## Dashboard Navigation

Six color-coded tiles drive the primary navigation, each showing an item count and expanding into its full section on click:

| Tile | Color | Function |
|---|---|---|
| Medications | Blue | View medication timeline, add/search medications |
| Appointments | Green | View/manage appointments, urgency alerts |
| Documents | Orange | Upload/download medical and legal documents |
| Care Logs | Purple | Line-by-line activity log with timestamps |
| Financial | Teal | Upload/manage financial documents |
| Contacts | Rose | Manage friends, relatives, and contacts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| UI / Styling | Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Vercel |

---

## Database Architecture

**Core tables:** `users`, `care_recipients` (core entity), `medical_records` (medications, conditions, care logs), `appointments`, `documents`, `emergency_contacts`.

**Data isolation:**
- Row Level Security (RLS) enforces multi-user data isolation at the database level, not just in application code
- Caregivers can only access data for their own linked care recipients
- Patients have strictly read-only access to their own linked records

---

## User Roles and Permissions

| Permission | Caregiver | Patient |
|---|---|---|
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

## Key Challenges & Solutions

> A couple of these are drafted with typical fixes for this exact class of problem (RLS policy scoping, role gating, Supabase Storage config, PDF layout). Swap in your specific fix details if they differ — the exact detail is what makes this section convincing in an interview.

### 1. Row Level Security policies blocking or leaking data
**Problem:** Early RLS policies either blocked caregivers from legitimately accessing their own patients' data, or in some cases allowed access that should have been restricted — RLS is unforgiving about getting the policy logic exactly right.
**Fix:** Rewrote the policies to scope every table's access explicitly through the `care_recipients` relationship (checking that the requesting user is the assigned caregiver, or the linked patient, before allowing a row to be returned), then tested each policy directly in the Supabase SQL editor with different user contexts before wiring it into the app.
**Takeaway:** RLS bugs are silent by default — a policy that's too permissive doesn't throw an error, it just quietly leaks data. Testing policies directly against real user IDs, not just through the UI, was necessary to catch that.

### 2. Role-based permissions not restricting access correctly
**Problem:** In early versions, Patient accounts could sometimes reach UI paths intended for Caregivers (e.g., edit actions), because permission checks were inconsistent across components.
**Fix:** Centralized all permission logic into a single `usePermissions` hook and a shared `permissions.ts` configuration, so every component checks the same source of truth instead of re-implementing role checks locally.
**Takeaway:** Scattering permission checks across components is how gaps happen — centralizing role logic in one place made it possible to reason about (and test) permissions consistently.

### 3. Document upload and storage configuration
**Problem:** Uploading medical, legal, and financial documents ran into issues with file type restrictions, size limits, and Supabase Storage bucket configuration.
**Fix:** Configured Supabase Storage buckets with explicit file-type and size constraints, and added validation in the `documentService` layer before upload so bad files were rejected early with a clear error rather than failing silently mid-upload.
**Takeaway:** File storage needs guardrails at both the client and storage-provider level — relying on just one layer leaves gaps for oversized or unsupported files to slip through.

### 4. Generating the Emergency Summary PDF correctly
**Problem:** Pulling together medications, conditions, and emergency contacts into a single, correctly formatted PDF on demand was trickier than expected — especially keeping the layout clean when the amount of data varied a lot between patients.
**Fix:** Built a dedicated `EmergencySummary.tsx` component that assembles and formats the relevant data server-side/client-side before handing it to the PDF generation step, with layout logic that adapts to varying amounts of content instead of assuming a fixed structure.
**Takeaway:** Generating documents from dynamic data means designing for the "empty" and "overflowing" cases up front, not just the average case.

---

## What I Learned

- Row Level Security enforces access at the database layer, which is a stronger guarantee than checking permissions only in the UI — but it has to be tested deliberately, since failures are silent
- Centralizing permission logic in one hook/config avoids the drift that happens when every component checks roles its own way
- File storage needs validation at multiple layers (client, service, storage provider) to be genuinely safe
- Generating documents (like the Emergency PDF) from variable, real-world data requires designing for edge cases, not just the happy path
- Healthcare-adjacent data makes "good enough" access control not good enough — the isolation guarantees have to be real, not just visual

---

## Quick Start

**Requirements:** Node.js 18+, npm or yarn, a Supabase account

**1. Clone the repository**
```bash
git clone https://github.com/poojasukhdeve-project/carevault.git
cd caregiver_app_project
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables** — create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Initialize the database**
- Log in to the Supabase Dashboard
- Open the SQL Editor
- Run the contents of `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`

**5. Start the development server**
```bash
npm run dev
```
Visit `http://localhost:3000`

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

## Service Layer

All database operations run through `lib/supabase-service.ts`:

- `userService` — user account operations
- `careRecipientService` — patient CRUD operations
- `medicalRecordService` — medications and care logs
- `appointmentService` — appointment management
- `documentService` — document upload/download/delete
- `emergencyContactService` — contact management

---

## Development

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

---

## Deployment

**Vercel (recommended)**
1. Push code to GitHub
2. Import the project in Vercel
3. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

**Manual**
```bash
npm run build
npm run start
```

---

## Documentation

| Document | Description |
|---|---|
| `docs/CareVault_Complete_Documentation.md` | Full application documentation |
| `docs/Deployment.md` | Deployment guide |
| `docs/TEST_REPORT.md` | Test report (use case, state transition, combination, unit tests) |

---

## Future Enhancements

- Push/email notifications for upcoming appointments and medication reminders
- Multi-caregiver support for a single patient (shared access with audit trail)
- Mobile app companion
- Integration with pharmacy or EHR systems
- Advanced search across documents and care logs

---

## License

MIT License

## Contributing

Issues and Pull Requests are welcome.
