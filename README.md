# Neelakannu Educational Trust Scholarship Platform

## Phase 1 MVP - Complete Digital Scholarship & Trust Management Platform

---

## Project Overview

A complete scholarship management platform built with:
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS v4
- **Backend**: Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Payments**: Razorpay TEST MODE
- **Email**: Resend transactional emails
- **Storage**: Cloudflare R2 / AWS S3 (private buckets)

---

## Requirements

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database (running locally or hosted)
3. **Redis** (optional, for session storage)

### Clone the Project

```bash
git clone <repository-url>
cd trust-platform
```

### Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configure Environment Variables

Create `.env` files based on the `.env.example` files:

```bash
# Backend .env
cp .env.example .env
# Edit .env with your values

# Frontend .env
cp .env.example .env
# Edit .env with your values
```

### Start PostgreSQL

```bash
# If using Docker
docker run -e POSTGRES_DB=neelakannu_trust -e POSTGRES_USER=neelakannu -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Or start manually
pg_ctlcluster 15 main start
```

### Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
# Or to reset and run from scratch:
npx prisma migrate reset
```

### Seed Development Data (Optional)

```bash
# Add any seed data via Prisma or SQL
```

### Start the Backend

```bash
cd backend
npm run dev
# or
npm start
```

The backend will run at `http://localhost:4000`

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Configuration

### Razorpay TEST MODE

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Go to Dashboard → Keys & Secret
3. Note down the Test Key ID and Test Key Secret
4. Set the Webhook Secret (used for signature verification)
5. Configure Webhook URL: `http://localhost:4000/api/payments/webhook`

### Resend Email Service

1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key from the Dashboard
3. Verify the sender email address (`neelakannu@edu.trust`)
4. Configure domain settings if needed

### Cloudflare R2 / AWS S3

1. Create a storage bucket for scholarship documents
2. Configure CORS settings for the bucket
3. Set up IAM policies for read/write access
4. Update the `.env` file with the bucket credentials

### Next.js Configuration

The frontend uses `next.config.ts` for optimization. Ensure the following are set:

```typescript
// next.config.ts
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register a new user |
| `/login` | POST | Login user |
| `/logout` | POST | Logout user |
| `/verify-email` | POST | Verify email address |
| `/forgot-password` | POST | Request password reset |
| `/reset-password` | POST | Reset password with token |

### Scholarships (`/api/scholarships`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Get all active scholarships |
| `/:id` | GET | Get scholarship by ID |
| `/eligibility-check` | POST | Check eligibility |

### Applications (`/api/applications`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Create a new application draft |
| `/me` | GET | Get current student's application |
| `/:id` | GET | Get application by ID (own only) |
| `/:id` | PATCH | Update application draft |
| `/:id/submit` | POST | Submit application |

### Payments (`/api/payments`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-order` | POST | Create Razorpay order |
| `/verify` | POST | Verify payment signature |
| `/webhook` | POST | Handle Razorpay webhook |
| `/application/:applicationId` | GET | Get payment status for application |

### Documents (`/api/documents`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:applicationId/documents/upload-url` | POST | Generate upload URL |
| `/:applicationId/documents` | POST | Record document metadata |
| `/:applicationId/documents` | GET | List documents |
| `/:applicationId/documents/:documentId` | DELETE | Delete document |

### Admin (`/api/admin`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Admin login |
| `/dashboard` | GET | Admin dashboard with stats |
| `/applications` | GET | List applications with filters |
| `/applications/:id` | GET | View application detail |
| `/applications/:id/status` | PATCH | Update application status |
| `/applications/export` | GET | Export applications as CSV |

---

## Student Flow

1. **Register** → `/register`
2. **Verify Email** → Check email for verification link
3. **Login** → `/login`
4. **Eligibility Check** → `/scholarship/eligibility`
5. **Start Application** → `/student/application`
6. **Save Draft** → Form data persisted as DRAFT
7. **Upload Documents** → `/student/application` → Documents section
8. **Create Payment** → `/payments/create-order` → Razorpay Checkout
9. **Backend Verification** → Payment verified via webhook
10. **Submit Application** → `/applications/:id/submit`
11. **Application ID** → Generated: `NET-2026-000001`
12. **Dashboard** → `/student/dashboard` → View status and details

---

## Admin Flow

1. **Admin Login** → `/admin/login`
2. **Dashboard** → `/admin/dashboard` → View stats and applications
3. **Search/Filter** → Filter by status, payment status, search query
4. **Open Application** → `/admin/applications/[id]`
5. **View Documents** → Secure private URLs
6. **Set Status** → Under Review → Approved/Rejected/Waitlisted/Correction Requested
7. **Email Notifications** → Automatic emails sent to students
8. **CSV Export** → `/admin/applications/export`

---

## Security

### Authentication

- JWT access tokens with 7-day expiry
- JWT refresh tokens with 30-day expiry
- bcrypt password hashing (10 salt rounds)
- Email verification required before login
- Password reset via token

### Authorization

- Students can only access their own applications
- Admins have full access to all applications
- Document ownership verified per application
- Payment verification requires valid Razorpay signature
- Webhook verification requires valid Razorpay webhook signature

### Input Validation

- MIME type validation for document uploads
- File size limits (50MB max)
- Application ID format: `NET-2026-XXXXX`
- Payment amount validation against scholarship fee
- E-mail format validation
- Strong password requirements

### Rate Limiting

- 100 requests per 15 minutes per IP
- Stricter limits on auth endpoints

### Error Handling

- All errors logged without sensitive data
- Proper HTTP status codes
- Graceful degradation on external service failures
- Email failures do not corrupt transactions

---

## Deployment

### Frontend (Vercel)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RESEND_API_KEY` (optional)
3. Deploy

### Backend (Render or Railway)

1. Create new service, connect Git repository
2. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL` (production URL)
3. Set up PostgreSQL database
4. Run Prisma migrations: `npx prisma migrate deploy`
5. Set build command: `npm run build`
6. Set start command: `npm start`

### Database (PostgreSQL)

- Use managed PostgreSQL (Render, Railway, Supabase, etc.)
- Enable backups
- Monitor connection pooling
- Set up SSL/TLS for production connections

### Storage (Cloudflare R2 or AWS S3)

1. Create bucket for scholarship documents
2. Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
3. Set up IAM policies
4. Update environment variables with bucket credentials

---

## Development Commands

### Backend

```bash
npm run dev       # Start dev server with nodemon
npm start         # Start production server
npm run build     # TypeScript check
npm run lint      # ESLint check
prisma migrate     # Create new migration
prisma generate   # Generate Prisma client
```

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint check
npm run start     # Start production server
```

---

## Folder Structure

```
trust-platform/
├── backend/          # Express + TypeScript backend
│   ├── src/
│   │   ├── auth/        # Authentication routes
│   │   ├── applications/# Application routes
│   │   ├── documents/   # Document upload routes
│   │   ├── email/       # Email service module
│   │   ├── payments/    # Razorpay payment routes
│   │   ├── scholarships/# Scholarship API routes
│   │   ├── admin/       # Admin portal routes
│   │   └── index.ts     # Main app entry point
│   ├── prisma/        # Prisma schema and migrations
│   ├── utils/         # Database utility
│   └── .env.example   # Environment variables example
├── frontend/         # Next.js + TypeScript frontend
│   ├── src/
│   │   ├── app/         # Page router pages
│   │   ├── components/  # UI components
│   │   └── styles/      # Tailwind styles
│   ├── .env.example   # Frontend environment variables
│   └── package.json
├── .env.example     # Backend environment variables example
├── docker-compose.yml # Docker services (PostgreSQL + Adminer)
└── README.md        # This file
```

---

## Known Issues

- SMS/WhatsApp not implemented (Phase 2+)
- Donor portal not implemented (Phase 2+)
- Mobile app not implemented (Phase 2+)
- OCR/KYC not implemented (Phase 2+)
- Selection committee portal not implemented (Phase 2+)

---

## Version

Phase 1 MVP - Neelakannu Educational Trust