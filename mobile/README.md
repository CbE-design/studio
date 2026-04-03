
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## 🚀 Quick Start (Development)

To run this app on your phone during development:

1.  **Install Expo Go**: Download the "Expo Go" app from the Google Play Store.
2.  **Start Development**:
    From the **root** folder of your project, run:
    ```bash
    npm run mobile
    ```
3.  **Scan the Code**: Scan the QR code that appears in your terminal using the **Expo Go** app. (Ensure your phone and computer are on the same network, or use the `--tunnel` option which is included in the script).

## 📦 How to Download the APK (Android)

To generate a standalone `.apk` file that you can install on any Android device, you use **EAS (Expo Application Services)**.

### 1. Setup EAS
- Create a free account at [expo.dev](https://expo.dev).
- Install the EAS tool globally on your computer:
  ```bash
  npm install -g eas-cli
  ```
- Log in to your account in the terminal:
  ```bash
  eas login
  ```

### 2. Build the APK
- Navigate into the mobile directory:
  ```bash
  cd mobile
  ```
- Run the build command:
  ```bash
  npm run build:apk
  ```
- **Wait for the Cloud Build**: Expo will handle the build in their cloud. This usually takes 5-10 minutes.
- **Download**: Once finished, the terminal will show a **Download link**. You can also find the file in your dashboard at [expo.dev](https://expo.dev/projects).

## 🛠 Environment Variables
The mobile app requires Firebase keys to work. Ensure `mobile/.env` exists with:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_API_BASE_URL=https://your-web-app-url.com
```
