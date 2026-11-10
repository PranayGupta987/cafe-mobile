# 🚀 Production Release & Deployment Guide - Café Mobile

This guide provides end-to-end instructions for building, signing, and deploying `cafe-mobile` to the Google Play Store (Android), Apple App Store / TestFlight (iOS), and Static Web Hosting.

---

## 1. Prerequisites

1. **Expo CLI & EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **EAS Account**:
   Sign in to your Expo account:
   ```bash
   eas login
   ```
3. **Link EAS Project**:
   ```bash
   eas project:init
   ```

---

## 2. Android Builds

### A. Internal Preview APK (Direct Device Installation)
To produce an installable standalone `.apk` for QA and team verification without uploading to the Play Console:
```bash
eas build --platform android --profile preview
```
- EAS will build the app in the cloud and output a direct download link / QR code to install the APK directly on Android hardware.

### B. Production Google Play App Bundle (`.aab`)
To generate an optimized Android App Bundle for Google Play Store release:
```bash
eas build --platform android --profile production
```
- EAS automatically manages your Android upload keystore securely in the cloud.

---

## 3. iOS Builds

### A. Simulator Build (macOS Testing)
```bash
eas build --platform ios --profile preview
```

### B. Production TestFlight & App Store (`.ipa`)
```bash
eas build --platform ios --profile production
```
- Automatically handles provisioning profiles, certificates, and bundle signing via your Apple Developer Account credentials.

---

## 4. Static Web Hosting Deployment

To export the fully pre-rendered static web application:
```bash
npm run export # or npx expo export
```
The output directory `dist/` can be deployed directly to:
- **Vercel**: `vercel deploy dist/`
- **Netlify**: `netlify deploy --dir=dist/ --prod`
- **Cloudflare Pages**: Connect repo and set build output to `dist`
- **AWS S3 + CloudFront**

---

## 5. Pre-Release Verification Checklist

Before triggering production builds:
- [x] Run TypeScript check: `npx tsc --noEmit`
- [x] Run Linter: `npm run lint`
- [x] Run Unit Tests: `npm test`
- [x] Test production bundle export: `npx expo export`
- [x] Verify backend API health: `GET https://cafeapp-backend-sgj7.onrender.com/api/v1/health`
- [x] Verify WebSocket gateway connectivity: `wss://cafeapp-backend-sgj7.onrender.com`
