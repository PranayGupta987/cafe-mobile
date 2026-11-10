# 🌐 Backend & API Integration Guide - Café Mobile

This document details the API endpoints, WebSocket event contracts, authentication flow, and data contracts used by `cafe-mobile` to interface with the Node.js / Express backend.

---

## 1. Production Service Endpoints

- **REST API Base URL**: `https://cafeapp-backend-sgj7.onrender.com/api/v1`
- **WebSocket Gateway**: `https://cafeapp-backend-sgj7.onrender.com`

---

## 2. Authentication Flow

### Login (`POST /api/v1/auth/login`)
- **Request**: `{ email: string, password: string }`
- **Response**: `{ success: true, data: { user: User, accessToken: string, refreshToken: string } }`

### Token Rotation (`POST /api/v1/auth/refresh`)
- **Request**: `{ refreshToken: string }`
- **Response**: `{ success: true, data: { accessToken: string, refreshToken: string } }`

---

## 3. Realtime Socket.IO Events

### Connection Lifecycle
Connects to root origin with authorization handshake:
```typescript
io('https://cafeapp-backend-sgj7.onrender.com', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

### Event Contracts
- **`order:new`**: Emitted when a customer places an order. Subscribed by staff in the `kitchen` room.
- **`order:status_update`**: Emitted when an order transitions between statuses (`PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`).
