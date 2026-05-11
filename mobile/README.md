
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## 🚀 Quick Start (Development / Testing)

To run this app on your phone immediately without a full build:

1.  **Install Expo Go**: Download the "Expo Go" app from the Google Play Store or iOS App Store.
2.  **Start Development**:
    From the **root** folder of your project, run:
    ```bash
    npm run mobile
    ```
    *Note: This command uses `--tunnel` via `@expo/ngrok` (which is already pre-installed in your package.json). This ensures your phone can connect to the development server even if they are on different Wi-Fi networks.*

3.  **Scan the Code**: Scan the QR code that appears in your terminal using your phone. 

## 📦 How to Download the APK (Standalone Android App)

To generate a standalone `.apk` file that you can install on any Android device, we use **EAS (Expo Application Services)**.

### 1. Setup EAS
- Install the EAS tool globally on your computer:
  ```bash
  npm install -g eas-cli
  ```
- Log in to your Expo account (create one at [expo.dev](https://expo.dev) if you don't have one):
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

## 🛠 Troubleshooting
- **Tunnel Error**: If you see an error related to `ngrok`, it is likely already installed. If not, running `npm run mobile` from the root will ensure all dependencies are resolved.
- **Firebase Config**: Ensure `mobile/.env` exists with your Firebase configuration.
