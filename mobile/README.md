
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## Prerequisite
1. Install the **Expo Go** app from the Google Play Store on your Android device.
2. Ensure your computer and your phone are on the same Wi-Fi network.

## Setup & Run Instructions

1.  **Open a Terminal** in your IDE.
2.  **Enter the mobile folder**:
    ```bash
    cd mobile
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Configure Environment**:
    Create a file named `.env` in the `mobile/` directory and add your Firebase credentials (copy values from your web `.env`):
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_API_BASE_URL=https://your-web-app-url.com
    ```
5.  **Start Expo**:
    ```bash
    npx expo start
    ```
    *Note: If you are using a cloud-based IDE (like Replit/Firebase Studio), you might need to use `npx expo start --tunnel` to bypass firewall issues.*

6.  **Scan the QR Code**:
    Open the **Expo Go** app on your Android phone and scan the QR code displayed in your terminal.

## Project structure

```
mobile/
  app/                   # Expo Router screens (File-based routing)
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
