
# MoneyGO Mobile (React Native + Expo)

Native Android version of the MoneyGO banking app, built with Expo and React Native.

## 🚀 Quick Start (Development)

To run this app on your phone during development:

1.  **Install Expo Go**: Download "Expo Go" from the Play Store.
2.  **Environment Setup**: 
    Ensure `mobile/.env` exists with your Firebase keys (see Troubleshooting).
3.  **Start Development**:
    From the **root** folder, run:
    ```bash
    npm run mobile
    ```
4.  **Scan the Code**: Scan the QR code in your terminal using the **Expo Go** app.

## 📦 How to Download the APK

To get a standalone Android APK file that you can install on any device:

1.  **Install EAS CLI**: 
    ```bash
    npm install -g eas-cli
    ```
2.  **Login to Expo**: 
    ```bash
    eas login
    ```
3.  **Start the Build**:
    Navigate to the mobile directory and run the build command:
    ```bash
    cd mobile
    npm run build:apk
    ```
4.  **Download**: Once the build finishes (usually 5-10 minutes), the terminal will provide a **direct download link** to your `.apk` file. You can also find it in your dashboard at [expo.dev](https://expo.dev).

## 🛠 Troubleshooting

- **Firebase Errors?**: Ensure `mobile/.env` has all variables starting with `EXPO_PUBLIC_`.
- **Build Failures?**: Ensure you have run `npm install` inside the `mobile` folder at least once.
