# Nextn - Next.js Firebase Application

## Overview
A Next.js 15 application with Firebase integration for authentication, Firestore database, and cloud functions. Built with React 18, TypeScript, Tailwind CSS, and Radix UI components.

## Project Structure
```
src/
├── app/           # Next.js App Router pages and layouts
│   └── lib/       # Firebase client configuration
├── components/    # React UI components
├── firebase/      # Firebase client provider
├── functions/     # Client-side function utilities
├── hooks/         # Custom React hooks
└── lib/           # Utility functions and definitions

functions/         # Firebase Cloud Functions (backend)
public/            # Static assets
```

## Tech Stack
- **Framework**: Next.js 15.0.7 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with tailwindcss-animate
- **UI Components**: Radix UI primitives
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

## Development

### Running Locally
The development server runs on port 5000:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

### Required Environment Variables
The app requires Firebase configuration via environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### SMS & Email Services (for Firebase Cloud Functions)
- `VONAGE_API_KEY` - Vonage API key for SMS sending
- `VONAGE_API_SECRET` - Vonage API secret for SMS sending
- `RESEND_API_KEY` - Resend API key for email sending

**Note**: These are used by Firebase Cloud Functions (`functions/index.js`). To deploy:
```bash
cd functions
firebase functions:config:set vonage.api_key="YOUR_KEY" vonage.api_secret="YOUR_SECRET"
firebase deploy --only functions
```

### Build
```bash
npm run build
```

### Production
```bash
npm run start -- -p 5000 -H 0.0.0.0
```

## Recent Changes
- Feb 09, 2026: Email proof of payment feature added
  - Email and SMS are two separate independent notification functions
  - Email sends the full proof of payment PDF as an attachment via sendEmail Cloud Function (Resend)
  - PDF generated server-side via generatePopPdfBase64Action, sent from client with auth context
  - Updated dashboard header icons (bell + message) to match Nedbank app style
- Feb 05, 2026: Payment notification feature added
  - Added notification option on payment amount page (Email/SMS selection)
  - Auto-sends SMS proof of payment after successful payment
  - SMS format: "Nedbank Payment: GGS FAMILY TRUST has paid R[AMOUNT] into Acc No: ...[LAST6] on [DATE] ,Ref: [REFERENCE] .Please check your account."
  - Updated account holder name to "GGS FAMILY TRUST" across the app
- Feb 02, 2026: Firebase Cloud Functions deployed
  - All 6 functions deployed to production (sendSms, sendEmail, addBeneficiary, processScheduledPayment, provisionNewUser, provisionExistingUserPockets)
  - Vonage SMS integration is now live
  - Fixed firebase-functions v7 compatibility (auth triggers use v1 syntax)
- Feb 01, 2026: Vonage SMS integration configured
  - Added Vonage API credentials for SMS proof of payment feature
  - SMS functionality uses Firebase Cloud Functions with Vonage SDK
- Feb 01, 2026: Initial Replit setup
  - Configured Next.js to allow all dev origins for Replit proxy
  - Set up development workflow on port 5000

## User Preferences
(None recorded yet)
