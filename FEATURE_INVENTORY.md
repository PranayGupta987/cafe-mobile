# 📋 Feature Inventory & Parity Matrix - Café Mobile

This document tracks feature parity between the original native Android Kotlin application and the new cross-platform React Native (`cafe-mobile`) application.

---

## Parity Matrix

| Feature Area | Kotlin Component / ViewModel | React Native Screen / Modal | Status |
|---|---|---|---|
| **Splash & Onboarding** | `SplashScreen` | `app/index.tsx` | ✅ Completed |
| **Authentication** | `LoginScreen`, `RegisterScreen` | `app/(auth)/login.tsx`, `register.tsx` | ✅ Completed |
| **Customer Home** | `CustomerHomeScreen` | `app/(tabs)/home.tsx` | ✅ Completed |
| **Menu Browsing** | `CustomerMenuScreen` | `app/(tabs)/menu.tsx` | ✅ Completed |
| **Item Detail** | `MenuItemDetailBottomSheet` | `app/modal/item-detail.tsx` | ✅ Completed |
| **Cart & Checkout** | `CustomerCartScreen` | `app/modal/cart.tsx` | ✅ Completed |
| **Live Orders** | `CustomerOrdersScreen` | `app/(tabs)/orders.tsx` | ✅ Completed |
| **Table QR Scanner** | `CustomerQrScannerScreen` | `app/modal/qr-scanner.tsx` | ✅ Completed |
| **Reservations** | `CustomerReservationsScreen` | `app/modal/reservations.tsx` | ✅ Completed |
| **Offers & Promos** | `CustomerOffersScreen` | `app/(tabs)/offers.tsx` | ✅ Completed |
| **Profile & Session** | `CustomerProfileScreen` | `app/(tabs)/profile.tsx` | ✅ Completed |
| **Kitchen Display (KDS)** | `KitchenScreen` | `app/kitchen/index.tsx` | ✅ Completed |
