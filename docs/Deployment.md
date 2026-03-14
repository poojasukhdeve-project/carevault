# CareVault Deployment Guide

## 1. Introduction

This document provides comprehensive instructions for deploying the CareVault application to production. The application uses Next.js for the frontend and Supabase for the backend services, with deployment primarily handled through Vercel for the frontend and Supabase for backend services.

## 2. Prerequisites

### 2.1 System Requirements
- Node.js 18 or higher
- npm or yarn package manager
- Git version control system
- Access to Supabase account
- Access to Vercel account (for frontend deployment)

### 2.2 Account Requirements
- Supabase account for database, authentication, and storage
- Vercel account for frontend hosting (or alternative hosting platform)
- Domain name (optional but recommended)

## 3. Environment Setup

### 3.1 Local Development Environment
1. Clone the repository:
```bash
git clone <repository-url>
cd caregiver_app_project
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables (see section 4).

### 3.2 Database Setup
1. Create a new Supabase project at https://supabase.com
2. Navigate to the SQL Editor in your Supabase Dashboard
3. Execute the schema creation script from `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`

## 4. Environment Configuration

### 4.1 Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4.2 Variable Descriptions

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL from the project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key from the project settings

These variables must be prefixed with `NEXT_PUBLIC_` to be accessible on the client side.

### 4.3 Vercel Environment Variables

When deploying to Vercel, these environment variables should be configured in the Vercel Dashboard:

1. Go to your project in the Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add the same variables as listed above

## 5. Database Initialization

### 5.1 Schema Setup
1. Log in to your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`
4. Paste and execute the entire script

### 5.2 Initial Data Setup
After schema creation, you may need to create initial user accounts:

```sql
-- Create a user in the auth.users table (via Supabase Dashboard or Auth API)
-- Then add the user to the custom users table:
INSERT INTO users (id, full_name, role, created_at, updated_at)
VALUES (
  'user-uuid-from-auth-users',  -- Get this from auth.users after user creation
  'John Doe',
  'caregiver',
  NOW(),
  NOW()
);
```

### 5.3 RLS Policy Verification
The schema setup script automatically creates all necessary Row Level Security (RLS) policies. Verify they are in place:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 6. Frontend Deployment

### 6.1 Vercel Deployment (Recommended)

#### 6.1.1 Via Vercel CLI
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link your project:
```bash
vercel login
vercel link
```

3. Deploy:
```bash
vercel --prod
```

#### 6.1.2 Via Git Integration
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project in the Vercel Dashboard
3. Vercel will automatically detect the Next.js configuration
4. Add environment variables in the project settings
5. Deploy automatically on every push to the main branch

#### 6.1.3 Manual Build and Deploy
1. Build the application:
```bash
npm run build
```

2. The build output will be in the `.next/` directory
3. Serve using Node.js:
```bash
npm run start
```

### 6.2 Alternative Deployment Options

#### 6.2.1 Netlify
1. Connect your Git repository to Netlify
2. Set build command to: `npm run build`
3. Set publish directory to: `out`
4. Add environment variables in Build & Deploy settings

#### 6.2.2 Self-Hosting
1. Build the application: `npm run build`
2. Export for static hosting: `npm run export` (if applicable)
3. Serve the `out/` directory using a web server like Nginx

## 7. Backend Configuration

### 7.1 Supabase Configuration

#### 7.1.1 Authentication Settings
1. In your Supabase Dashboard, go to Authentication → Settings
2. Configure sign-up settings (email confirmations, password strength, etc.)
3. Set up OAuth providers if needed (Google, etc.)

#### 7.1.2 Storage Configuration
1. In your Supabase Dashboard, go to Storage
2. Create a bucket named `documents` (or update the bucket name in your functions)
3. Set appropriate policies for the bucket

#### 7.1.3 Database Configuration
The schema script handles most database configuration, but verify:
- Extensions are enabled (uuid-ossp, pgcrypto)
- Functions are properly created
- Views are working as expected
- Triggers are active

### 7.2 Custom Domain Setup
For production deployments:

#### 7.2.1 Frontend Domain
1. In Vercel Dashboard, go to your project
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update DNS settings as prompted

#### 7.2.2 Supabase Domain
1. In Supabase Dashboard, go to Settings → API
2. Note the project URL for your custom domain setup
3. Update your application's environment variables if needed

## 8. SSL/TLS Configuration

### 8.1 Frontend SSL
SSL certificates are automatically handled by Vercel for both vercel.app domains and custom domains.

### 8.2 Backend SSL
Supabase automatically provides SSL for database connections.

### 8.3 Redirect Configuration
Configure HTTP to HTTPS redirects in your hosting platform's settings.

## 9. Monitoring and Logging

### 9.1 Frontend Monitoring
- Vercel provides built-in analytics and error tracking
- Set up custom logging if needed in your application

### 9.2 Backend Monitoring
- Monitor Supabase project through the dashboard
- Check query performance and connection metrics
- Review authentication logs regularly

### 9.3 Error Tracking
- Implement error boundaries in React components
- Use Sentry or similar for advanced error tracking (optional)

## 10. Backup and Recovery

### 10.1 Database Backups
- Supabase provides automated daily backups
- Configure backup retention policies in project settings
- Test recovery procedures periodically

### 10.2 Application Backups
- Maintain Git repository as code backup
- Store environment variables securely (password managers, etc.)
- Document deployment procedures

## 11. Security Configuration

### 11.1 Environment Security
- Never commit environment variables to version control
- Use strong, unique keys for each environment
- Rotate keys periodically

### 11.2 Database Security
- RLS policies are configured via the schema script
- Regularly review user roles and permissions
- Monitor database access logs

### 11.3 Authentication Security
- Configure appropriate password policies
- Set up two-factor authentication if needed
- Regularly audit user accounts

## 12. Performance Optimization

### 12.1 Frontend Optimization
- Leverage Next.js automatic code splitting
- Implement proper image optimization
- Use Vercel's edge network for global distribution

### 12.2 Database Optimization
- Monitor slow query logs
- Optimize indexes based on query patterns
- Scale database resources as needed

### 12.3 Caching Strategy
- Use Next.js cache headers appropriately
- Implement browser caching for static assets
- Consider CDN for frequently accessed content

## 13. Post-Deployment Tasks

### 13.1 Initial Setup
1. Create admin user accounts
2. Configure initial settings
3. Test all major functionality

### 13.2 Health Checks
1. Verify all pages load correctly
2. Test authentication flow
3. Confirm database connections work
4. Verify file uploads/downloads work
5. Test emergency summary generation

### 13.3 Performance Baseline
1. Measure initial load times
2. Establish baseline metrics
3. Set up monitoring alerts

## 14. Updating Deployments

### 14.1 Frontend Updates
For Vercel deployments, updates are automatic on Git pushes to the main branch.
For manual deployments:
```bash
vercel --prod
```

### 14.2 Backend Updates
1. For database schema changes, create migration scripts
2. Test changes in a staging environment first
3. Apply to production during scheduled maintenance windows

### 14.3 Rollback Procedures
1. Keep previous deployment versions available
2. Maintain database migration rollback scripts
3. Test rollback procedures in staging

## 15. Troubleshooting

### 15.1 Common Issues

#### 15.1.1 Environment Variables Not Working
- Verify variables are prefixed with NEXT_PUBLIC_
- Check that variables are set in the correct environment
- Restart the development server after changing environment variables

#### 15.1.2 Database Connection Issues
- Verify Supabase URL and key are correct
- Check that RLS policies are properly configured
- Ensure firewall settings allow connections

#### 15.1.3 Authentication Problems
- Confirm auth settings in Supabase dashboard
- Check redirect URLs are properly configured
- Verify user roles are set correctly

### 15.2 Diagnostic Commands

#### 15.2.1 Frontend Diagnostics
```bash
# Check environment variables
npm run dev
# Look for any warnings or errors in the console

# Build diagnostics
npm run build
```

#### 15.2.2 Database Diagnostics
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 16. Maintenance Schedule

### 16.1 Regular Maintenance Tasks
- Weekly: Review logs and performance metrics
- Monthly: Update dependencies (after testing)
- Quarterly: Review security configurations
- Annually: Plan infrastructure scaling

### 16.2 Update Strategy
- Test updates in staging environment first
- Schedule updates during low-usage periods
- Prepare rollback plans for all major updates
- Communicate planned maintenance to users

## 17. Cost Management

### 17.1 Supabase Costs
- Monitor usage against free tier limits
- Configure billing alerts
- Optimize database queries to reduce resource usage

### 17.2 Vercel Costs
- Understand Vercel's pricing tiers
- Monitor build minutes usage
- Optimize build processes to reduce costs

## 18. Scaling Considerations

### 18.1 Traffic Scaling
- Vercel automatically scales frontend resources
- Monitor Supabase connection limits
- Plan database scaling as user base grows

### 18.2 Data Scaling
- Plan for storage growth in document management
- Consider archiving older records
- Optimize database queries for performance

## 19. Compliance and Regulations

### 19.1 Data Protection
- Ensure GDPR compliance for EU users
- Implement appropriate data retention policies
- Provide data export capabilities

### 19.2 Healthcare Regulations
- Consider HIPAA requirements if handling PHI
- Implement appropriate audit trails
- Ensure proper data encryption