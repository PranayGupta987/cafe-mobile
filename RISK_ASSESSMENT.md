# ⚠️ Risk Assessment & Mitigation - Café Mobile

This document details key operational, architectural, and security risks identified during the migration process, along with implemented mitigation strategies.

---

## Risk Matrix

| Risk | Impact | Likelihood | Implemented Mitigation |
|---|---|---|---|
| **Free-Tier Cold Starts** | High latency on initial requests if backend is idle | High | Cold-start detection in API client, friendly user messaging, and health pings on splash screen. |
| **Financial Rounding Errors** | Inconsistent totals or discrepancies with backend | High | Strict integer paise calculation across all cart and order flows; 5% GST calculated using `Math.round((subtotal - discount) * 5 / 100)`. |
| **WebSocket Connection Drops** | Missed order updates on network switch | Medium | Automatic reconnection with exponential backoff; manual pull-to-refresh on orders and kitchen screens. |
| **Concurrent Token Refresh** | Race condition causing expired refresh tokens | High | Mutex queue in Axios response interceptor ensuring only one refresh request runs at any time. |
| **Camera Permission Denial** | Customer unable to scan table QR code | Medium | Seamless fallback to manual table number entry on the QR scanner screen. |
