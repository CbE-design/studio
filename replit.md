# NexTN - Financial Banking Application

## Overview
A Next.js-based mobile banking application with Firebase integration for authentication and data storage.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Firebase (Firestore, Authentication, Functions)
- **AI**: Genkit with Google AI for personalized financial tips

## Project Structure
```
src/
├── app/
│   ├── (app)/           # Main app routes (dashboard, accounts, payments, etc.)
│   ├── api/             # API routes
│   ├── lib/             # Server-side utilities and Firebase config
│   ├── login/           # Login page
│   └── signup/          # Signup page
├── components/          # Reusable React components
│   └── ui/              # UI component library
├── firebase/            # Firebase client provider
├── hooks/               # Custom React hooks
└── lib/                 # Client-side utilities
```

## Required Environment Variables
The app requires Firebase configuration:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Running the App
- Development: `npm run dev -- -p 5000 -H 0.0.0.0`
- Build: `npm build`
- Start: `npm start`

## Deployment
Configured for Replit autoscale deployment with `npm start`.

## Important Notes
- **Environment Variables**: Firebase env vars must NOT have quotes in their values. The values should be plain text like `studio-3883937532-b7f00`, not `"studio-3883937532-b7f00"`.
- **User Data Structure**: Bank accounts are stored at `users/{userId}/bankAccounts/{accountId}` with transactions at `users/{userId}/bankAccounts/{accountId}/transactions/{txId}`

## Recent Changes
- 2024-12-23: Implemented Nedbank green gradient styling
  - Updated header gradient to dark green (#006B3C to #004D2C)
  - Bottom navigation now has dark green background with white icons
  - Active tab indicator with green underline
- 2024-12-23: Fixed accounts not showing on dashboard
  - Root cause: Firebase environment variables had quotes embedded in values
  - Fixed by setting correct env var values without quotes
  - Updated genkit packages to v1.27.0 to resolve peer dependency conflicts
- 2024-12-21: Added automatic account seeding for new users
  - New users now get 3 sample bank accounts with transactions when signing up
  - Accounts: Savvy Bundle Current Account, Current Account, MyPockets Savings
  - Sample transactions for each account
- 2024-12-21: Initial setup for Replit environment
  - Removed duplicate next.config.ts file
  - Updated next.config.mjs for Replit compatibility
  - Configured workflow for port 5000
