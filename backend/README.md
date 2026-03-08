<h1 align="center">⚙️ Backend</h1>
<h3 align="center">Event Processing Hub — Real-time Communication Layer</h3>

<p align="center">
  Backend service yang memproses event dari AI Service dan mendistribusikan data<br/>
  ke Frontend secara real-time via <strong>Socket.IO</strong> dan <strong>Firebase Cloud Messaging</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Zod-4.x-3068B7?style=flat-square&logo=zod&logoColor=white" />
</p>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur](#-arsitektur)
- [Tech Stack](#-tech-stack)
- [Struktur File](#-struktur-file)
- [Middleware Stack](#-middleware-stack)
- [API Endpoints](#-api-endpoints)
- [Event Flow](#-event-flow)
- [WebSocket Events](#-websocket-events)
- [Push Notifications (FCM)](#-push-notifications-fcm)
- [Validation Schemas](#-validation-schemas)
- [In-Memory Store](#-in-memory-store)
- [Logging](#-logging)
- [Konfigurasi](#-konfigurasi)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)

---

## 🔍 Gambaran Umum

Backend adalah **hub pemrosesan event** dalam ekosistem SAMTEK VMS yang berperan sebagai jembatan antara AI Service dan Frontend:

1. **Menerima event** dari AI Service via REST API (`POST /events`)
2. **Memvalidasi payload** menggunakan Zod schema validation
3. **Menyimpan event** ke in-memory ring buffer (tanpa database)
4. **Mem-broadcast data** ke connected frontend client via Socket.IO
5. **Mengirim push notification** ke browser via Firebase Cloud Messaging saat truk terdeteksi
6. **Menyajikan snapshot** images dari AI Service via static file serving

---

## 🏗 Arsitektur

```
                        ┌─────────────────────────────────────────────────┐
                        │                   Backend                       │
                        ├─────────────────────────────────────────────────┤
                        │                                                 │
   AI Service           │   ┌──────────────┐     ┌──────────────────┐     │
   POST /events  ───▶   │   │    Routes    │───▶│   Controller     │     │
                        │   └──────────────┘     └───────┬──────────┘     │
                        │                                │                │
                        │                    ┌───────────┴──────┐         │
                        │                    ▼                  ▼         │
                        │           type: "detections"    type: "crossing"│
                        │                    │                  │         │
                        │                    ▼                  ▼         │
                        │            ┌──────────────┐     ┌──────────┐    │
                        │            │  Socket.IO   │     │ Validator│    │
                        │            │  broadcast   │     │  (Zod)   │    │
                        │            │ "detections" │     └─────┬────┘    │
                        │            └──────┬───────┘           │         │
                        │                   │                   ▼         │
                        │                   │           ┌──────────────┐  │
                        │                   │           │ Event Store  │  │
                        │                   │           │ (ring buffer)│  │
                        │                   │           └───────┬──────┘  │
                        │                   │                   │         │
                        │                   │                   ▼         │
                        │                   │           ┌───────────────┐ │
                        │                   │           │  Socket.IO    │ │
                        │                   │           │  broadcast    │ │
                        │                   │           │"vehicle_event"│ │
                        │                   │           └───────┬───────┘ │
                        │                   │                   │         │
                        │                   │                   ▼         │
                        │                   │          ┌────────────────┐ │
                        │                   │          │  FCM Service   │ │
                        │                   │          │ (truk only)    │ │
                        │                   │          └────────┬───────┘ │
                        └───────────────────┼───────────────────┼─────────┘
                                            │                   │
                                  Socket.IO │                   │ FCM Push
                                            ▼                   ▼
                                        Frontend           Browser Push
                                       (Real-time)         Notification
```

---

## 🛠 Tech Stack

| Teknologi              | Versi | Kegunaan                               |
| ---------------------- | ----- | -------------------------------------- |
| **Node.js**            | 18+   | Runtime                                |
| **Express.js**         | 5.x   | HTTP framework                         |
| **Socket.IO**          | 4.x   | WebSocket real-time communication      |
| **Firebase Admin SDK** | 13.x  | Firebase Cloud Messaging (server-side) |
| **Zod**                | 4.x   | Runtime schema validation              |
| **Winston**            | 3.x   | Structured logging (console + file)    |
| **Helmet**             | 8.x   | HTTP security headers                  |
| **Morgan**             | 1.x   | HTTP request logging                   |
| **express-rate-limit** | 8.x   | API rate limiting                      |
| **CORS**               | 2.x   | Cross-Origin Resource Sharing          |
| **UUID**               | 13.x  | Unique event ID generation             |

---

## 📁 Struktur File

```
backend/
├── src/
│   ├── server.js                  # HTTP server bootstrap + graceful shutdown
│   ├── app.js                     # Express app + middleware stack
│   ├── config/
│   │   ├── index.js               # Environment config loader
│   │   └── firebase-service-account.json  # Firebase credentials
│   ├── controllers/
│   │   └── events.controller.js   # Request handlers (create, list, health)
│   ├── services/
│   │   ├── event.service.js       # Event processing + validation
│   │   ├── fcm.service.js         # Firebase Admin SDK wrapper
│   │   └── notification.service.js # Push notification dispatcher
│   ├── routes/
│   │   ├── events.routes.js       # Event & health endpoints
│   │   └── notification.routes.js # FCM subscription endpoint
│   ├── validators/
│   │   └── event.validator.js     # Zod schema definitions
│   ├── store/
│   │   └── eventStore.js          # In-memory ring buffer (max 100)
│   ├── websocket/
│   │   └── socket.js              # Socket.IO initialization
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handler
│   └── utils/
│       └── logger.js              # Winston logger setup
└── package.json
```

---

## 🔒 Middleware Stack

Middleware diaplikasikan secara berurutan pada setiap request:

```
 Incoming Request
        │
        ▼
┌─────────────────┐
│   Static Files  │  /snapshots → ai-service/snapshots/
└────────┬────────┘
         ▼
┌─────────────────┐
│     Helmet      │  Security headers (XSS, HSTS, CSP, dll.)
└────────┬────────┘
         ▼
┌─────────────────┐
│     Morgan      │  HTTP logging → Winston (combined format)
└────────┬────────┘
         ▼
┌─────────────────┐
│      CORS       │  Whitelist frontend URLs (dari env)
└────────┬────────┘
         ▼
┌─────────────────┐
│   JSON Parser   │  express.json()
└────────┬────────┘
         ▼
┌─────────────────┐
│  Rate Limiter   │  100 req / 15 min (skip: /events POST)
└────────┬────────┘
         ▼
┌─────────────────┐
│     Routes      │  /events, /health, /notifications/subscribe
└────────┬────────┘
         ▼
┌─────────────────┐
│  Error Handler  │  Centralized JSON error response
└─────────────────┘
```

> **Rate Limiter** dikecualikan untuk `POST /events` karena AI Service mengirim event dengan frekuensi tinggi.

---

## 📡 API Endpoints

### `POST /events`

Menerima event dari AI Service. Mendukung dua tipe payload.

**Detection Stream** — Dikirim setiap N frame:

```json
{
  "type": "detections",
  "frame_width": 1280,
  "frame_height": 720,
  "objects": [
    {
      "class": "mobil",
      "confidence": 0.87,
      "bbox": [120, 340, 280, 450],
      "center_x": 200.0,
      "center_y": 395.0
    }
  ]
}
```

→ Di-broadcast via Socket.IO event `detections` ke semua client.

**Vehicle Crossing** — Dikirim saat kendaraan melintas garis:

```json
{
  "type": "vehicle_crossing",
  "vehicle": "truk",
  "confidence": 0.92,
  "timestamp": "2026-03-08T12:30:00Z",
  "image": "truck_20260308_123000.jpg",
  "is_special_event": true
}
```

→ Divalidasi → Disimpan ke store → Di-broadcast via `vehicle_event` → Jika truk: FCM push notification.

---

### `GET /events`

Mengambil riwayat crossing event terbaru.

| Parameter | Tipe    | Default | Keterangan                |
| --------- | ------- | ------- | ------------------------- |
| `limit`   | integer | 50      | Jumlah event yang diambil |

**Response:**

```json
[
  {
    "id": "uuid-v4",
    "type": "vehicle_crossing",
    "vehicle": "truk",
    "confidence": 0.92,
    "timestamp": "2026-03-08T12:30:00Z",
    "image": "http://localhost:5000/snapshots/truck_20260308_123000.jpg",
    "is_special_event": true,
    "created_at": "2026-03-08T12:30:01.123Z"
  }
]
```

---

### `GET /health`

Health check endpoint.

```json
{ "status": "ok" }
```

---

### `POST /notifications/subscribe`

Subscribe FCM token ke topic `vehicle-alerts`.

**Request:**

```json
{ "token": "fcm-device-token" }
```

---

### `GET /snapshots/:filename`

Static file serving untuk snapshot images yang disimpan oleh AI Service.

---

## 🔄 Event Flow

```
AI Service ── POST /events ──▶ events.controller.js
                                       │
                           ┌───────────┴──────────────┐
                           ▼                          ▼
                    type: "detections"       type: "vehicle_crossing"
                           │                          │
                           ▼                          ▼
                   handleDetectionStream()   handleCrossingEvent()
                           │                          │
                           ▼                          ▼
                    Socket.IO emit            event.service.js
                     "detections"             → validateEventPayload()
                     { frame_width,           → processEvent()
                       frame_height,                  │
                       objects[] }                    ▼
                           │                  eventStore.addEvent()
                           │                  (ring buffer, max 100)
                           │                          │
                           │                          ▼
                           │                   Socket.IO emit
                           │                    "vehicle_event"
                           │                    { id, vehicle, ... }
                           │                          │
                           │                          ▼
                           │                  notification.service.js
                           │                  if is_special_event:
                           │                    → sendCrossingNotification()
                           │                    → fcm.service.sendToTopic()
                           │                    → topic: "vehicle-alerts"
                           ▼                          ▼
                       Frontend               Frontend + Browser
                    (Canvas Overlay)       (Event Feed + Push Notification)
```

---

## 🔌 WebSocket Events

### Server → Client

| Event Name      | Payload                                                    | Trigger                                 |
| --------------- | ---------------------------------------------------------- | --------------------------------------- |
| `detections`    | `{ frame_width, frame_height, objects[] }`                 | Setiap N frame dari AI Service          |
| `vehicle_event` | `{ id, vehicle, confidence, timestamp, is_special_event }` | Setiap kendaraan melintas garis deteksi |

### Connection Events

| Event        | Log                                                        |
| ------------ | ---------------------------------------------------------- |
| `connection` | `[INFO] new websocket client connected (socket.id)`        |
| `disconnect` | `[INFO] websocket client disconnected (socket.id): reason` |

### Socket.IO Config

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
```

---

## 🔔 Push Notifications (FCM)

### Arsitektur

```
Frontend                          Backend                      Firebase
   │                                │                             │
   │  POST /notifications/subscribe │                             │
   │  { token: "..." }  ──────────▶ │                             │
   │                                │── subscribeToTopic() ─────▶ │
   │                                │   topic: "vehicle-alerts"   │
   │                                │                             │
   │       [Saat truk crossing]     │                             │
   │                                │── sendToTopic() ──────────▶ │
   │                                │   { title, body, image }    │
   │◀─── FCM Push ──────────────────│◀───────────────────────────│
   │  → Browser Notification        │                             │
```

### Payload Notifikasi

Hanya truk (`is_special_event: true`) yang trigger push notification:

```javascript
{
  notification: {
    title: "🚛 TRUK Detected",
    body: "Confidence: 92%",
    image: "http://localhost:5000/snapshots/truck_20260308_123000.jpg"
  },
  data: {
    vehicle: "truk",
    confidence: "0.92",
    timestamp: "2026-03-08T12:30:00Z",
    image: "http://localhost:5000/snapshots/truck_20260308_123000.jpg"
  },
  topic: "vehicle-alerts"
}
```

---

## ✅ Validation Schemas

Backend menggunakan **Zod** untuk validasi semua incoming event dari AI Service.

### Detection Stream Schema

```javascript
z.object({
  type: z.literal("detections"),
  frame_width: z.number().positive(),
  frame_height: z.number().positive(),
  objects: z
    .array(
      z.object({
        class: z.string(),
        confidence: z.number().min(0).max(1),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        center_x: z.number().optional(),
        center_y: z.number().optional(),
      }),
    )
    .default([]),
});
```

### Crossing Event Schema

```javascript
z.object({
  type: z.literal("vehicle_crossing"),
  vehicle: z.string().min(1),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  image: z.string().optional(),
  is_special_event: z.boolean().default(false),
});
```

---

## 💾 In-Memory Store

Backend menyimpan crossing event di memory tanpa database, menggunakan ring buffer:

```javascript
const MAX_EVENTS = 100;
const events = [];

function addEvent(event) {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

function getEvents(limit = 50) {
  return events.slice(-limit).reverse();
}
```

| Properti    | Nilai        | Keterangan                                  |
| ----------- | ------------ | ------------------------------------------- |
| Kapasitas   | 100 event    | Event lama otomatis dihapus                 |
| Ordering    | Newest first | `getEvents()` mengembalikan urutan terbalik |
| Persistence | ❌           | Data hilang saat server restart             |

---

## 📝 Logging

Backend menggunakan **Winston** dengan dual transport:

| Transport | Level   | Format    | Output           |
| --------- | ------- | --------- | ---------------- |
| Console   | `debug` | Colorized | Terminal (dev)   |
| File      | `error` | JSON      | `logs/error.log` |
| File      | `all`   | JSON      | `logs/all.log`   |

### Log Levels

```
error: 0  →  red
warn:  1  →  yellow
info:  2  →  green
http:  3  →  magenta
debug: 4  →  white
```

### Format (development)

```
[2026-03-08 19:30:00:000] info: Server listening on port 5000 in development mode
[2026-03-08 19:30:05:123] info: Crossing event: truk (0.92)
[2026-03-08 19:30:05:125] info: [INFO] Truck detected — sending notification
```

---

## ⚙️ Konfigurasi

### Environment Variables

| Variable                       | Default                                                                                 | Keterangan                    |
| ------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------- |
| `PORT`                         | `5000`                                                                                  | Port server                   |
| `FRONTEND_URL`                 | `http://localhost:3000`                                                                 | URL frontend (CORS whitelist) |
| `NODE_ENV`                     | `development`                                                                           | Environment mode              |
| `FIREBASE_API_KEY`             | AIzaSyDyMIjt5aSZov-09TUWuAi4eIC95JZL0cQ                                                 | Firebase API key              |
| `FIREBASE_AUTH_DOMAIN`         | samtek-vms-test.firebaseapp.com                                                         | Firebase auth domain          |
| `FIREBASE_PROJECT_ID`          | samtek-vms-test                                                                         | Firebase project ID           |
| `FIREBASE_STORAGE_BUCKET`      | samtek-vms-test.firebasestorage.app                                                     | Firebase storage bucket       |
| `FIREBASE_MESSAGING_SENDER_ID` | 875177878168                                                                            | Firebase messaging sender ID  |
| `FIREBASE_APP_ID`              | 1:875177878168:web:aab00f4daa93442dd3a6ed                                               | Firebase app ID               |
| `FIREBASE_VAPID_KEY`           | BFGqBZW0iZXOFD8S7k23A-qWvXAYiKcBfhuA9jV2v5A3cCnpDSAaHj_Z1gso_YpFt_MBOMO8GKU9f66n-RGjsiQ | VAPID key untuk web push      |

### Error Handling

Error handler global menangkap semua unhandled errors:

| Mode        | Response                                                |
| ----------- | ------------------------------------------------------- |
| Development | `{ status, message, stack }` (full detail)              |
| Production  | `{ status: "error", message: "Internal Server Error" }` |

### Graceful Shutdown

Server menangani sinyal `SIGINT` dan `SIGTERM`:

```
1. Terima signal → log "Shutting down gracefully..."
2. Tutup HTTP server (stop menerima koneksi baru)
3. Tunggu koneksi aktif selesai
4. Jika > 10 detik → force shutdown
```

---

## 🚀 Instalasi & Menjalankan

### Prerequisites

| Software    | Versi |
| ----------- | ----- |
| **Node.js** | ≥ 18  |

### Instalasi

```bash
cd backend

# Install dependencies
npm install
```

### Menjalankan

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### Verifikasi

```bash
# Health check
curl http://localhost:5000/health
# Expected: {"status":"ok"}

# List events
curl http://localhost:5000/events
# Expected: [] (kosong jika belum ada event)
```

---

> Bagian dari ekosistem **SAMTEK VMS** — lihat [root README](../README.md) untuk dokumentasi lengkap sistem.
