# 🏗️ Project Architecture - Café Mobile (React Native / Expo)

This document outlines the architectural decisions, design patterns, state management strategy, networking layer, and security boundaries implemented in the `cafe-mobile` cross-platform application.

---

## 1. High-Level Architecture

`cafe-mobile` is structured around a modular, clean-architecture inspired React Native codebase using **Expo SDK 58** and **Expo Router v4**.

```
[ Expo Router v4 (File-Based Navigation) ]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
[ Zustand Stores ]   [ TanStack Query ]
 (Auth, Cart, Session) (Server Caching)
       │                   │
       └─────────┬─────────┘
                 ▼
     [ Centralized Axios Client ]
      (JWT Auth + Mutex Refresh)
                 │
                 ▼
     [ Production Backend & WS ]
     (https://cafeapp-backend-sgj7.onrender.com)
```

---

## 2. Directory Structure & Separation of Concerns

- **`app/` (Expo Router)**: File-based routing corresponding directly to navigation screens, modals, and tabs:
  - `(auth)/`: Login and registration flows.
  - `(tabs)/`: Main 5-tab customer dashboard (`home`, `menu`, `offers`, `orders`, `profile`).
  - `kitchen/`: Real-time Kitchen Display System (KDS).
  - `modal/`: Presentation modals (`cart`, `qr-scanner`, `reservations`, `item-detail`).
- **`src/api/`**: Centralized Axios client and API request wrappers.
- **`src/components/`**: Reusable design system components categorized into `common` (buttons, cards, loaders) and `specific` (quantity steppers, status badges, veg indicators).
- **`src/constants/`**: Design tokens for colors (`colors.ts`), dimensions (`dimens.ts`), and typography (`typography.ts`).
- **`src/hooks/`**: Custom hooks for Socket.IO (`useSocket.tsx`), haptics, and color schemes.
- **`src/stores/`**: Global client state management via Zustand v5 (`authStore.ts`, `cartStore.ts`, `sessionStore.ts`).
- **`src/utils/`**: Shared pure functions (integer paise currency formatting, date helpers, secure storage).

---

## 3. State Management Strategy

### Client State (Zustand v5)
- **`useAuthStore`**: Manages user authentication status, profile data, roles (`CUSTOMER`, `KITCHEN`, `ADMIN`), and login/logout actions.
- **`useCartStore`**: Manages shopping cart items, selected table association, active promo codes, special cooking instructions, and real-time calculations.
- **`useSessionStore`**: Manages active table session check-ins, guest counts, and table occupancy state.

### Server State (TanStack React Query v5)
- Declarative data fetching, caching, automatic background refetching, and mutation invalidation for menu items, orders, offers, and reservations.

---

## 4. Financial Invariant Model (Integer Paise)

To completely eliminate floating-point rounding errors common in JavaScript/React Native (`0.1 + 0.2 !== 0.3`), all monetary values are stored, transmitted, and computed as **integer paise** (1 INR = 100 paise).

- **Subtotal calculation**: Sum of `item.pricePaise * quantity`.
- **Tax calculation**: 5% GST computed on post-discount subtotal:
  $$\text{taxPaise} = \text{Math.round}\left(\frac{\max(0, \text{subtotalPaise} - \text{discountPaise}) \times 5}{100}\right)$$

---

## 5. Security & Authentication

- **Hardware SecureStore**: Access and refresh tokens are stored using `expo-secure-store` (encrypted Keychain/EncryptedSharedPreferences).
- **Axios Interceptors**:
  - Request interceptor injects `Authorization: Bearer <accessToken>`.
  - Response interceptor catches `401 Unauthorized` errors, locks execution via a mutex queue, and requests a token refresh (`POST /api/v1/auth/refresh`). On success, retries queued requests; on failure, clears tokens and redirects to Login.
