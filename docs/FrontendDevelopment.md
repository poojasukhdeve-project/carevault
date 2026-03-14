# CareVault Frontend Development Guide

## 1. Introduction

This document provides comprehensive guidance for developing the frontend of the CareVault application. The frontend is built using Next.js 14 with the App Router, TypeScript, and Tailwind CSS, following modern React development practices.

## 2. Project Structure

### 2.1 Directory Structure
```
app/                    # Next.js App Router pages
├── calendar/           # Calendar page
│   └── page.tsx
├── dashboard/          # Main dashboard page
│   └── page.tsx
├── login/              # Login page
│   └── page.tsx
├── patients/           # Patient management page
│   └── page.tsx
├── test-registration/  # Test registration page
│   └── page.tsx
├── globals.css         # Global styles
├── layout.tsx          # Root layout
└── page.tsx            # Home page
components/             # Reusable React components
├── ui/                 # Shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   └── textarea.tsx
└── EmergencySummary.tsx # Emergency summary component
contexts/               # React Context providers
└── AuthContext.tsx     # Authentication context
hooks/                  # Custom React hooks
└── usePermissions.ts   # Permission management hook
lib/                    # Utility functions and services
├── supabase.ts         # Supabase client
├── supabase-service.ts # Database service layer
├── permissions.ts      # Permission utilities
└── utils.ts            # General utilities
types/                  # TypeScript type definitions
└── supabase.ts         # Database types
database/               # Database schema scripts
tests/                  # Test files
test-results/           # Test results
test-screenshots/       # Test screenshots
```

### 2.2 Key Files and Their Purposes

- **app/layout.tsx**: Root layout with AuthProvider wrapping
- **contexts/AuthContext.tsx**: Manages authentication state and user profile
- **hooks/usePermissions.ts**: Provides role-based permission checks
- **lib/supabase-service.ts**: Service layer for database operations
- **lib/permissions.ts**: Defines role-based permissions
- **types/supabase.ts**: TypeScript interfaces for database entities

## 3. Technology Stack

### 3.1 Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components following shadcn/ui patterns
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Fetching**: Supabase client library

### 3.2 Component Libraries
- **Radix UI**: Low-level primitives for accessible components
- **Lucide React**: Beautiful icon library
- **Custom UI Components**: Located in `components/ui/`

## 4. Development Patterns

### 4.1 Authentication Flow
The application uses a protected route pattern:

```tsx
// In layout.tsx
<AuthProvider>
  {children}
</AuthProvider>

// In pages requiring authentication
import { ProtectedRoute } from '@/contexts/AuthContext'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Protected content */}
    </ProtectedRoute>
  )
}
```

### 4.2 Context Usage
The AuthContext provides authentication state throughout the application:

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, userProfile, userRole, loading } = useAuth()
  
  // Use auth information
  if (loading) return <LoadingSpinner />
  if (!user) return <LoginForm />
  
  return <div>Dashboard content</div>
}
```

### 4.3 Permission Checks
Permissions are managed through the usePermissions hook:

```tsx
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const permissions = usePermissions()
  
  return (
    <div>
      {permissions.hasPermission('canManageAppointments') && (
        <button>Add Appointment</button>
      )}
    </div>
  )
}
```

## 5. Component Architecture

### 5.1 UI Components
Located in `components/ui/`, these follow the shadcn/ui pattern:

```tsx
// Example button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 5.2 Business Logic Components
Business-specific components like `EmergencySummary.tsx` implement specific functionality:

```tsx
// Example structure
function EmergencySummary({ patientId }: { patientId: string }) {
  // Component logic here
  return <div>Emergency summary content</div>
}
```

## 6. Data Management

### 6.1 Service Layer Pattern
The application uses a service layer pattern in `lib/supabase-service.ts`:

```tsx
// Example service
export const careRecipientService = {
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
  
  async createCareRecipient(careRecipient: Omit<CareRecipient, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('care_recipients')
      .insert({
        ...careRecipient,
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

### 6.2 State Management
Components manage state using React hooks:

```tsx
function DashboardComponent() {
  const [patients, setPatients] = useState<CareRecipient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<CareRecipient | null>(null)
  const [medications, setMedications] = useState<MedicalRecord[]>([])
  
  useEffect(() => {
    // Load data when component mounts
    loadPatientData()
  }, [selectedPatient])
}
```

## 7. Styling Guidelines

### 7.1 Tailwind CSS
The application uses Tailwind CSS for styling with a utility-first approach:

```tsx
<div className="container mx-auto px-4 py-8">
  <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
    <CardContent className="pt-12 pb-12 text-center">
      <h2 className="text-3xl font-bold mb-3 text-primary">Welcome to CareVault</h2>
      <p className="text-lg text-muted-foreground mb-2">
        Start managing care by adding your first patient
      </p>
    </CardContent>
  </Card>
</div>
```

### 7.2 Responsive Design
All components are designed to be responsive:

```tsx
// Grid layouts adapt to screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive content */}
</div>
```

## 8. Forms and User Input

### 8.1 Form Handling
Forms use controlled components with validation:

```tsx
const [patientForm, setPatientForm] = useState({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  diagnosis: '',
  allergies: ''
})

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setPatientForm(prev => ({
    ...prev,
    [name]: value
  }))
}
```

### 8.2 File Uploads
Document uploads use the Supabase storage service:

```tsx
const handleUploadDocument = async () => {
  if (!selectedPatient || !selectedFile) return

  try {
    await documentService.uploadDocument(selectedFile, selectedPatient.id, {
      name: documentForm.name,
      category: documentForm.category,
      description: documentForm.date
    })
  } catch (error) {
    console.error('Error uploading document:', error)
  }
}
```

## 9. Error Handling

### 9.1 API Error Handling
API calls include proper error handling:

```tsx
try {
  const patientId = await careRecipientService.createCareRecipient(patientData)
  // Success handling
} catch (error: any) {
  console.error('Error adding patient:', error)
  const errorMessage = error?.message || error?.error_description || 'Failed to add patient'
  alert(`Failed to add patient: ${errorMessage}`)
}
```

### 9.2 Loading States
Components implement loading states for better UX:

```tsx
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    // API call
  } finally {
    setLoading(false)
  }
}

return (
  <Button disabled={loading}>
    {loading ? 'Processing...' : 'Submit'}
  </Button>
)
```

## 10. Routing and Navigation

### 10.1 Next.js App Router
The application uses the Next.js App Router for navigation:

```tsx
import { useRouter } from 'next/navigation'

function MyComponent() {
  const router = useRouter()
  
  const handleNavigation = () => {
    router.push('/dashboard')
  }
}
```

### 10.2 Protected Routes
Sensitive pages use the ProtectedRoute component:

```tsx
// dashboard/page.tsx
import { ProtectedRoute } from '@/contexts/AuthContext'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

## 11. Internationalization (i18n)
The application is set up for internationalization:

```tsx
// Currently in Chinese with plans for English
<html lang="zh-CN">
```

Future enhancements will include language switching capabilities.

## 12. Accessibility

### 12.1 ARIA Labels
Components include proper ARIA attributes:

```tsx
<Button aria-label="Logout">
  <LogOut className="w-4 h-4" />
</Button>
```

### 12.2 Keyboard Navigation
Interactive elements support keyboard navigation:

```tsx
<button 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</button>
```

## 13. Performance Optimization

### 13.1 Code Splitting
Next.js automatically handles code splitting for routes.

### 13.2 Image Optimization
Use Next.js Image component for optimization:

```tsx
import Image from 'next/image'

<Image 
  src="/profile.jpg" 
  alt="Profile picture"
  width={200}
  height={200}
  priority
/>
```

### 13.3 Memoization
Use React.memo for performance:

```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
})
```

## 14. Testing Considerations

### 14.1 Component Testing
Components should be testable with React Testing Library:

```tsx
// Example test structure
describe('Dashboard Component', () => {
  it('renders patient information correctly', () => {
    // Test implementation
  })
})
```

### 14.2 Mocking API Calls
API calls should be easily mockable for testing:

```tsx
// Services should be structured to allow mocking
export const patientService = {
  getPatients: async () => {
    // API call implementation
  }
}
```

## 15. Best Practices

### 15.1 TypeScript Usage
- Use strict typing throughout the application
- Define clear interfaces for props and state
- Use discriminated unions for complex types

### 15.2 Component Design
- Keep components small and focused
- Follow the single responsibility principle
- Use composition over inheritance

### 15.3 Naming Conventions
- Use PascalCase for components
- Use camelCase for functions and variables
- Use kebab-case for filenames
- Use descriptive names that reflect purpose

### 15.4 Code Organization
- Group related functionality together
- Separate concerns appropriately
- Maintain consistent folder structure
- Use barrel exports to simplify imports

## 16. Security Considerations

### 16.1 Input Sanitization
- Validate all user inputs
- Sanitize data before displaying
- Use proper encoding to prevent XSS

### 16.2 Authorization Checks
- Perform permission checks on all sensitive operations
- Never rely solely on UI hiding for security
- Validate permissions on the backend as well

## 17. Future Enhancements

### 17.1 Progressive Web App (PWA)
Consider implementing PWA features for offline capabilities.

### 17.2 Internationalization
Add multi-language support beyond the current Chinese implementation.

### 17.3 Accessibility Improvements
Continue enhancing accessibility features to meet WCAG standards.

### 17.4 Performance Monitoring
Implement performance monitoring tools to track metrics.

## 18. Troubleshooting Common Issues

### 18.1 Authentication Issues
- Ensure Supabase is properly configured in environment variables
- Check that RLS policies are correctly set up
- Verify that user sessions are properly maintained

### 18.2 Data Loading Problems
- Verify that service functions are properly awaited
- Check that error handling is implemented correctly
- Ensure proper loading states are shown to users

### 18.3 Styling Issues
- Use Tailwind's responsive prefixes for mobile compatibility
- Check that CSS custom properties are properly defined
- Verify that component classes are not conflicting