
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## Setup & Run Instructions

To run this app on your phone, you must follow these steps exactly:

1.  **Install Expo Go**: Download the "Expo Go" app from the Google Play Store on your Android device.
2.  **Open a Terminal**: In your IDE (e.g., Firebase Studio), open a new terminal tab.
3.  **Install Dependencies**:
    ```bash
    cd mobile
    npm install
    ```
4.  **Configure Environment**:
    Create a file named `.env` in the `mobile/` directory. Copy your Firebase config from the web project.
    **CRITICAL**: Variables must start with `EXPO_PUBLIC_`.
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=your_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_API_BASE_URL=https://your-web-app-url.com
    ```
5.  **Start Expo with Tunnel**:
    From the project root, run:
    ```bash
    npm run mobile
    ```
    *This uses `--tunnel` which is required for cloud IDEs to connect to your phone.*

6.  **Scan the QR Code**: 
    - Wait for the QR code to appear in the terminal.
    - Open the **Expo Go** app on your phone.
    - Tap "Scan QR Code" and point it at your computer screen.

## Troubleshooting
- **QR Code not scanning?** Make sure you are using the `--tunnel` flag (the command `npm run mobile` does this automatically).
- **"Network request failed"?** Ensure your `.env` variables are correct and the web app is deployed/running.
- **Dependency errors?** Run `rm -rf node_modules && npm install` inside the `mobile` folder.
