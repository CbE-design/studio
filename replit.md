# NexTN - Financial Banking Application

## Overview
A Next.js-based mobile banking application with Firebase integration for authentication and data storage.

## Tech Stack
- **Frontend**: Next.js 14.2.5, React 18, TypeScript
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

## Recent Changes
- 2024-12-21: Added automatic account seeding for new users
  - New users now get 3 sample bank accounts with transactions when signing up
  - Accounts: Savvy Bundle Current Account, Current Account, MyPockets Savings
  - Sample transactions for each account
- 2024-12-21: Initial setup for Replit environment
  - Removed duplicate next.config.ts file
  - Updated next.config.mjs for Replit compatibility
  - Configured workflow for port 5000
