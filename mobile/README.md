
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## 🚀 Quick Start Instructions

To run this app on your phone, follow these steps in order:

1.  **Install Expo Go**: Download the "Expo Go" app from the Google Play Store on your Android device.
2.  **Open the Terminal**: Look at the bottom of this IDE. Open a new terminal tab.
3.  **Setup Environment**: 
    Create a new file inside the `mobile/` folder named `.env`. 
    Copy your Firebase configuration from the web project. It MUST look like this:
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_API_BASE_URL=https://your-preview-url.com
    ```
4.  **Install & Start**:
    In the terminal, type these commands:
    ```bash
    cd mobile
    npm install
    npm run android # This starts expo with the --tunnel flag automatically
    ```
5.  **Scan the Code**: 
    - Wait for a large QR code to appear in the terminal.
    - Open **Expo Go** on your phone.
    - Tap **"Scan QR Code"** and point it at the screen.

## 🛠 Troubleshooting

- **QR Code not appearing?**: Make sure you are in the `mobile` directory in the terminal.
- **"Network request failed"?**: This usually means your phone can't talk to the computer. Ensure you see the `Starting tunnel` message in the terminal.
- **Firebase Errors?**: Double-check your `mobile/.env` file. The variables MUST start with `EXPO_PUBLIC_`.
