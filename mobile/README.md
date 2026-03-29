# MoneyGO Mobile (React Native + Expo)

Android native version of the MoneyGO banking app, built with Expo and React Native.

## Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android device.

## Firebase

The app connects to the same Firebase project as the web app. Auth credentials work across both platforms.

## Project structure

```
mobile/
  app/                   # Expo Router screens
    (auth)/login.tsx     # Login screen
    (app)/               # Authenticated tab screens
      index.tsx          # Overview tab
      cards.tsx          # Cards tab
      transact.tsx       # Transact tab
      recipients.tsx     # Recipients tab
      more.tsx           # More tab
  src/
    lib/firebase.ts      # Firebase config
    lib/definitions.ts   # TypeScript types
    context/AuthContext  # Auth state
```

## Phase status

| Phase | Status |
|-------|--------|
| 1 — Foundation (auth, navigation shell) | ✅ Done |
| 2 — Core banking screens | Pending |
| 3 — Payment flow | Pending |
| 4 — Remaining features | Pending |
