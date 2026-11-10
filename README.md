# ☕ Café Mobile - Cross-Platform Application (React Native / Expo SDK 58)

A production-grade, high-performance cross-platform mobile application for Android and iOS, built with **Expo SDK 58**, **Expo Router v4**, **React 19**, **React Native 0.88**, **Zustand**, and **TanStack React Query v5**.

Migrated with 100% feature parity from the native Android Kotlin (Jetpack Compose) café application, providing a unified, performant, and delightful digital dining experience.

---

## 🚀 Key Highlights & Architectural Strengths

- **100% Feature Parity**: Full migration covering Authentication, Table QR Scanning, Real-time Customer & Kitchen Order Flow, Reservations, Coupons/Offers, and Profile management.
- **Strict Monetary Invariance**: All currency amounts (items, taxes, discounts, totals) are computed in **integer paise** (1 INR = 100 paise), entirely eliminating IEEE 754 floating-point rounding errors. Includes standard 5% GST calculation.
- **Hardware-Backed Secure Storage**: Access and refresh tokens are persisted in hardware keystore via `expo-secure-store` with transparent web fallback.
- **Resilient JWT Rotation Interceptors**: Centralized Axios client with thread-safe mutex queue handling automatic `401 Unauthorized` token refresh without race conditions.
- **Live Real-time Kitchen & Customer Sync**: Full bidirectional communication via `socket.io-client` with instant reactive UI updates and native haptic feedback.
- **Camera & Barcode Scanning**: Seamless table QR code scanning powered by `expo-camera` with a manual table number input fallback.
- **Fluid & Accessible UI**: Follows Material 3 & modern F&B design tokens (`CafeBrown`, `CafeCream`, `CafeGold`), with touch targets >= 48dp and accessible color contrast.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Expo SDK 58 | React Native 0.88.1, React 19.3.0, New Architecture Enabled |
| **Routing** | Expo Router v4 | File-based typed routing with native tabs and bottom sheet modals |
| **Language** | TypeScript 6.0 | Strict mode (`strict: true`, `noImplicitAny: true`) |
| **Client State** | Zustand v5 | In-memory session stores (`useAuthStore`, `useCartStore`, `useSessionStore`) |
| **Server State** | TanStack React Query v5 | Declarative caching, background refetching, and cache invalidation |
| **HTTP Client** | Axios | Request token injection, mutex-guarded refresh queue on 401 |
| **Realtime** | Socket.IO Client v4 | Live order notifications (`order:new`, `order:status_update`) |
| **Security** | Expo SecureStore | Hardware-backed encrypted key-value storage |
| **Hardware** | Expo Camera, Expo Haptics | Camera barcode scanning, tactile quantity stepper feedback |
| **Design / Icons** | Expo Vector Icons (Ionicons) | Custom Material 3 design tokens matching original café branding |

---

## 📂 Project Structure

```
cafe-mobile/
├── src/
│   ├── api/                      # Centralized API layer
│   │   └── client.ts             # Axios instance & token refresh interceptor
│   ├── app/                      # Expo Router Navigation & Screen Hierarchy
│   │   ├── (auth)/               # Authentication Flows
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx         # Customer & Staff Login
│   │   │   └── register.tsx      # New Customer Registration
│   │   ├── (tabs)/               # 5-Tab Customer Dashboard
│   │   │   ├── _layout.tsx       # Tab bar with theme icons
│   │   │   ├── home.tsx          # Table status, quick actions, offers, specials
│   │   │   ├── menu.tsx          # Searchable menu, category filter, veg toggle
│   │   │   ├── offers.tsx        # Coupons list with min-order validation
│   │   │   ├── orders.tsx        # Order history with live socket status
│   │   │   └── profile.tsx       # User details, table checkout, cafe info
│   │   ├── kitchen/              # Kitchen Display System (KDS)
│   │   │   └── index.tsx         # Real-time ticket board & status progression
│   │   ├── modal/                # Interactive Presentation Modals
│   │   │   ├── cart.tsx          # Cart review, promo apply, 5% GST, order placement
│   │   │   ├── qr-scanner.tsx    # Camera barcode scan & manual table check-in
│   │   │   └── reservations.tsx  # Table reservation booking & cancellation
│   │   ├── _layout.tsx           # Root providers: QueryClient, Auth, Socket
│   │   └── index.tsx             # Splash screen & route decider
│   ├── components/               # Reusable Design System Components
│   │   ├── common/               # Button, Card, Loading, Empty, Error
│   │   └── specific/             # QuantityStepper, VegIndicator, StatusBadge, FloatingCartBar
│   ├── constants/                # Design Tokens
│   │   ├── colors.ts             # Palette (CafeBrown, CafeCream, CafeGold, Status)
│   │   ├── dimens.ts             # Spacing, Radius, Elevation tokens
│   │   └── typography.ts         # Typography scale definitions
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useSocket.tsx         # Socket.IO connection & event context
│   │   ├── use-color-scheme.ts
│   │   └── use-theme.ts
│   ├── stores/                   # Zustand Stores
│   │   ├── authStore.ts          # User credentials & role
│   │   └── cartStore.ts          # Cart items, paise math, promo code, special instructions
│   ├── types/                    # TypeScript interfaces matching backend models
│   │   └── index.ts
│   └── utils/                    # Shared Utilities
│       ├── currency.ts           # Integer paise formatting & GST calculation
│       └── storage.ts            # Hardware SecureStore with web fallback
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏃 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or yarn
- Expo Go app on physical iOS/Android device, or an Android Emulator / iOS Simulator

### Installation

1. Navigate to the project root:
   ```bash
   cd "C:/Users/Pranay Gupta/Desktop/cafe-mobile"
   ```

2. Dependencies are already configured. To verify or reinstall:
   ```bash
   npm install
   ```

3. Validate TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

5. In the terminal:
   - Press `a` to run on Android Emulator.
   - Press `i` to run on iOS Simulator (macOS required).
   - Press `w` to run on Web.
   - Scan the displayed QR code with the **Expo Go** app on your phone.

---

## 🌐 Backend & Environment Configuration

The application is pre-configured to communicate with the production backend:
- **API Base URL**: `https://cafeapp-backend-sgj7.onrender.com/api/v1`
- **WebSocket URL**: `https://cafeapp-backend-sgj7.onrender.com`

---

## 📄 License & Attribution

Co-Authored by Claude Code & CafeApp Engineering Team.
All rights reserved.
