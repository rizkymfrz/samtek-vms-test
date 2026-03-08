<h1 align="center">🖥️ Frontend</h1>
<h3 align="center">Real-time Dashboard — AI Video Monitoring Interface</h3>

<p align="center">
  Dashboard single-page untuk monitoring lalu lintas secara real-time<br/>
  dengan live streaming <strong>WebRTC</strong>, detection overlay, dan <strong>push notification</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn/ui-4.x-000000?style=flat-square&logo=shadcnui&logoColor=white" />
</p>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Tech Stack](#-tech-stack)
- [Struktur File](#-struktur-file)
- [Koneksi Real-time](#-koneksi-real-time)
  - [WebRTC (WHEP)](#1-webrtc-whep--live-video)
  - [Socket.IO](#2-socketio--detection-data)
  - [Firebase Cloud Messaging](#3-firebase-cloud-messaging--push-notification)
- [Komponen Dashboard](#-komponen-dashboard)
- [Detection Overlay (Canvas)](#-detection-overlay-canvas)
- [State Management](#-state-management)
- [UI Library](#-ui-library)
- [Konfigurasi](#-konfigurasi)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)

---

## 🔍 Gambaran Umum

Frontend adalah **dashboard monitoring real-time** dalam ekosistem SAMTEK VMS yang menampilkan:

1. **Live streaming CCTV** via WebRTC (WHEP)
2. **Detection overlay** — bounding box dan garis deteksi di atas video via Canvas
3. **Vehicle counter** — penghitung kendaraan per kategori (mobil, motor, truk, bus)
4. **Event feed** — log real-time setiap kendaraan yang melintas garis deteksi
5. **Analytics chart** — grafik area intensitas lalu lintas per menit
6. **Push notification** — browser notification saat truk terdeteksi (via Firebase Cloud Messaging)
7. **Toast alert** — in-app notification via Sonner saat truk terdeteksi

---

## 🛠 Tech Stack

| Teknologi                 | Versi   | Kegunaan                        |
| ------------------------- | ------- | ------------------------------- |
| **Next.js**               | 16.1.6  | React framework (App Router)    |
| **React**                 | 19.2.3  | UI library                      |
| **TypeScript**            | 5.x     | Type safety                     |
| **Tailwind CSS**          | 4.x     | Utility-first CSS               |
| **shadcn/ui**             | 4.x     | Component library (Radix-based) |
| **Recharts**              | 2.x     | Charting library                |
| **Framer Motion**         | 11.x    | Animations                      |
| **Socket.IO Client**      | 4.x     | WebSocket client                |
| **Firebase (Client SDK)** | 12.x    | FCM token & message listener    |
| **Sonner**                | 1.x     | Toast notification              |
| **Lucide React**          | 0.344.x | Icon library                    |

---

## 📁 Struktur File

```
frontend/
├── app/
│   ├── layout.tsx             # Root layout (Inter + Geist Mono fonts, dark mode)
│   ├── page.tsx               # Dashboard page — semua logic real-time
│   ├── globals.css            # Global styles + Tailwind config
│   └── favicon.ico
│
├── components/
│   ├── dashboard/             # Feature-specific components
│   │   ├── CameraPanel.tsx    # Live video + canvas detection overlay
│   │   ├── VehicleCounter.tsx # Counter cards per vehicle type
│   │   ├── EventFeed.tsx      # Scrollable crossing event log
│   │   ├── AnalyticsChart.tsx # Real-time area chart (Recharts)
│   │   ├── Sidebar.tsx        # Navigation sidebar + system status
│   │   └── TopBar.tsx         # Connection status + stream mode indicator
│   └── ui/                    # shadcn/ui primitives
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       └── sonner.tsx
│
├── lib/
│   ├── firebase.ts            # FCM token request & message listener
│   └── utils.ts               # Utility functions (cn)
│
├── hooks/
│   └── use-mobile.ts          # Responsive breakpoint hook
│
├── public/
│   ├── logo.svg               # SAMTEK logo
│   ├── truck-icon.png         # Push notification icon
│   └── firebase-messaging-sw.js  # FCM service worker
│
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── components.json            # shadcn/ui configuration
└── package.json
```

---

## 🔗 Koneksi Real-time

Dashboard menggunakan **3 channel komunikasi** yang berjalan paralel:

### 1. WebRTC (WHEP) — Live Video

Menampilkan live video dari MediaMTX di `<video>` element.

```
┌──────────┐         SDP Offer          ┌───────────┐
│  Browser │ ─────────────────────────▶ │  MediaMTX │
│  (WHEP)  │                            │  :8889    │
│          │ ◀───────────────────────── │           │
└──────────┘         SDP Answer         └───────────┘
      │
      │  ICE: stun:stun.l.google.com:19302
      │
      ▼
  <video> element
  (autoPlay, muted, playsInline)
```

**Flow:**

1. Buat `RTCPeerConnection` dengan STUN server
2. Tambah transceiver video & audio (`recvonly`)
3. Create SDP offer → tunggu ICE gathering (timeout 3s)
4. POST SDP ke `WHEP_URL` (`/live/whep`)
5. Set SDP answer sebagai remote description
6. Tunggu `connectionState === "connected"` (timeout 5s)

---

### 2. Socket.IO — Detection Data

Menerima data deteksi dan crossing event dari Backend secara real-time.

| Event           | Data                                                       | Aksi di Frontend                               |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `connect`       | —                                                          | Set `connected = true`                         |
| `disconnect`    | —                                                          | Set `connected = false`                        |
| `detections`    | `{ frame_width, frame_height, objects[] }`                 | Update `latestDetections` → canvas redraw      |
| `vehicle_event` | `{ id, vehicle, confidence, timestamp, is_special_event }` | Update `crossingEvents`, `counts`, `chartData` |

**Saat `vehicle_event` diterima:**

```
vehicle_event
      │
      ├──▶ crossingEvents.unshift(event)     → EventFeed update
      │    (max 50 events)
      │
      ├──▶ counts[vehicle]++                 → VehicleCounter update
      │
      ├──▶ chartData.push({ time, count })   → AnalyticsChart update
      │    (max 15 data points)
      │
      └──▶ if is_special_event:
             toast.error("Truk Terdeteksi")  → Sonner toast notification
```

---

### 3. Firebase Cloud Messaging — Push Notification

Browser push notification saat truk terdeteksi (bahkan saat tab tidak aktif).

```
┌────────────────────────────────────────────────┐
│                  Startup Flow                  │
├────────────────────────────────────────────────┤
│                                                │
│  1. requestFCMToken()                          │
│     ├── isSupported()         ← Check browser  │
│     ├── requestPermission()   ← Ask user       │
│     └── getToken(vapidKey)    ← Get FCM token  │
│                                                │
│  2. POST /notifications/subscribe              │
│     { token: "fcm-token" }   → Backend         │
│     → subscribeToTopic("vehicle-alerts")       │
│                                                │
│  3. setupMessageListener()                     │
│     onMessage(messaging, callback)             │
│     → new Notification(title, body, icon)      │
│                                                │
└────────────────────────────────────────────────┘
```

**Service Worker** (`public/firebase-messaging-sw.js`):

- Menangani push notification saat tab background
- Menampilkan native browser notification

---

## 🧩 Komponen Dashboard

### `CameraPanel.tsx`

Panel utama yang menampilkan live video dengan detection overlay.

| Fitur            | Detail                                           |
| ---------------- | ------------------------------------------------ |
| Video source     | WebRTC WHEP stream (primary)                     |
| Aspect ratio     | 16:9 (responsive)                                |
| Canvas overlay   | Bounding box + scan line (requestAnimationFrame) |
| Status indicator | Live badge (cyan = WebRTC, red = fallback)       |
| Info badges      | FPS: 30, AI: AKTIF                               |

---

### `VehicleCounter.tsx`

4 counter cards yang menampilkan jumlah kendaraan per kategori.

| Kendaraan | Icon    | Warna                        |
| --------- | ------- | ---------------------------- |
| Mobil     | `Car`   | Blue (`text-blue-400`)       |
| Truk      | `Truck` | Cyan (`text-cyan-400`)       |
| Motor     | `Bike`  | Emerald (`text-emerald-400`) |
| Bus       | `Bus`   | Amber (`text-amber-400`)     |

- Animasi counter menggunakan **Framer Motion** (`scale: 1.1 → 1`)
- Badge "Hari Ini" pada setiap card

---

### `EventFeed.tsx`

Scrollable list yang menampilkan setiap crossing event secara real-time.

| Fitur         | Detail                                                   |
| ------------- | -------------------------------------------------------- |
| Max events    | 50 (FIFO, terbaru di atas)                               |
| Special event | Highlight merah (border + background) + badge "DITANDAI" |
| Normal event  | Background slate dengan dot cyan                         |
| Snapshot      | Menampilkan snapshot image jika tersedia                 |
| Empty state   | "Menunggu aktivitas kendaraan..."                        |
| Badge count   | Total jumlah log                                         |

---

### `AnalyticsChart.tsx`

Grafik area real-time yang menampilkan intensitas lalu lintas per menit.

| Fitur       | Detail                                                        |
| ----------- | ------------------------------------------------------------- |
| Library     | Recharts (`AreaChart`, `ResponsiveContainer`)                 |
| Data points | Max 15 (sliding window)                                       |
| Warna       | Cyan gradient (`#06b6d4`)                                     |
| Update      | Setiap `vehicle_event` → increment count pada menit yang sama |
| Badge       | "REALTIME" dengan pulse indicator                             |

---

### `Sidebar.tsx`

Navigation sidebar (visible di desktop, hidden di mobile).

| Menu Item  | Icon              | Status             |
| ---------- | ----------------- | ------------------ |
| Dashboard  | `LayoutDashboard` | Active (cyan glow) |
| Kamera     | `Video`           | —                  |
| Analitik   | `Activity`        | —                  |
| Pengaturan | `Settings`        | —                  |

Footer menampilkan "Sistem Online" dengan timestamp pembaruan terakhir.

---

### `TopBar.tsx`

Status bar di bagian atas dashboard.

| Indicator         | Detail                                                      |
| ----------------- | ----------------------------------------------------------- |
| Kamera Aktif      | "Kamera Aktif: 1"                                           |
| Server AI         | Badge "SERVER AI ONLINE" (cyan) / "SERVER AI OFFLINE" (red) |
| Stream Mode       | Badge "STREAMING" (WebRTC) / "TERPUTUS"                     |
| Notification bell | Badge dot indicator                                         |

---

## 🎨 Detection Overlay (Canvas)

`CameraPanel` merender detection overlay menggunakan HTML5 Canvas di atas `<video>` element:

```
┌──────────────────────────────────────────────┐
│                                              │
│       ┌─     ─┐                              │
│       │ MOBIL │ 87%    ← Label + confidence  │
│       │       │        ← Corner-style box    │
│       └─     ─┘           (blue #0ea5e9)     │
│                                              │
│ GARIS DETEKSI ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← Dashed line (red)
│                                              │
│       ┌─      ─┐                             │
│       │  TRUK  │ 92%   ← Warna merah (truk)  │
│       └─      ─┘          (red #ef4444)      │
│                                              │
└──────────────────────────────────────────────┘
```

### Rendering Details

| Elemen       | Implementasi                                         |
| ------------ | ---------------------------------------------------- |
| Bounding box | Corner-style lines (bukan full rectangle)            |
| Color coding | Truk: `#ef4444` (red), lainnya: `#0ea5e9` (sky blue) |
| Glow effect  | `ctx.shadowColor` + `ctx.shadowBlur = 10`            |
| Label        | Filled rectangle + text (`CLASS CONFIDENCE%`)        |
| Scan line    | Dashed line di tengah frame (`canvas.height / 2`)    |
| Render loop  | `requestAnimationFrame`                              |

---

## 📊 State Management

Dashboard menggunakan **React state** (tanpa external state management):

| State              | Type                                | Default        | Source                             |
| ------------------ | ----------------------------------- | -------------- | ---------------------------------- |
| `connected`        | `boolean`                           | `false`        | Socket.IO connection event         |
| `streamMode`       | `"webrtc" \| "mp4" \| "connecting"` | `"connecting"` | WebRTC connection result           |
| `latestDetections` | `DetectionPayload \| null`          | `null`         | Socket.IO `detections` event       |
| `crossingEvents`   | `CrossingEvent[]`                   | `[]`           | Socket.IO `vehicle_event` (max 50) |
| `counts`           | `{ mobil, motor, truk, bus }`       | All `0`        | Accumulated from `vehicle_event`   |
| `chartData`        | `{ time, count }[]`                 | `[]`           | Aggregated per minute (max 15)     |

### Refs

| Ref         | Type                | Usage                            |
| ----------- | ------------------- | -------------------------------- |
| `videoRef`  | `HTMLVideoElement`  | WebRTC stream target             |
| `canvasRef` | `HTMLCanvasElement` | Detection overlay rendering      |
| `socketRef` | `Socket`            | Socket.IO instance               |
| `pcRef`     | `RTCPeerConnection` | WebRTC peer connection (cleanup) |

---

## 🎨 UI Library

### shadcn/ui Components

| Component     | File                  | Usage                          |
| ------------- | --------------------- | ------------------------------ |
| `Card`        | `ui/card.tsx`         | Container untuk semua panel    |
| `Badge`       | `ui/badge.tsx`        | Status indicators, labels      |
| `Button`      | `ui/button.tsx`       | Navigation, actions            |
| `ScrollArea`  | `ui/scroll-area.tsx`  | EventFeed scrollable container |
| `Avatar`      | `ui/avatar.tsx`       | User avatar di TopBar          |
| `Separator`   | `ui/separator.tsx`    | Visual dividers                |
| `AspectRatio` | `ui/aspect-ratio.tsx` | 16:9 video container           |
| `Sonner`      | `ui/sonner.tsx`       | Toast notification provider    |

### Design System

| Token            | Value                           |
| ---------------- | ------------------------------- |
| Background utama | `#020617` (slate-950)           |
| Card background  | `#0f172a/80` (slate-900 + blur) |
| Border           | `#1e293b` (slate-800)           |
| Accent           | `#06b6d4` (cyan-500)            |
| Alert            | `#ef4444` (red-500)             |
| Font primary     | Inter (Google Fonts)            |
| Font mono        | Geist Mono                      |

---

## ⚙️ Konfigurasi

### Environment Variables

| Variable                                   | Default                                                                                 | Keterangan                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_BACKEND_URL`                  | `http://localhost:5000`                                                                 | URL backend server           |
| `NEXT_PUBLIC_WEBRTC_WHEP_URL`              | `http://localhost:8889/live/whep`                                                       | MediaMTX WHEP endpoint       |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | AIzaSyDyMIjt5aSZov-09TUWuAi4eIC95JZL0cQ                                                 | Firebase API key             |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | samtek-vms-test.firebaseapp.com                                                         | Firebase auth domain         |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | samtek-vms-test                                                                         | Firebase project ID          |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | samtek-vms-test.firebasestorage.app                                                     | Firebase storage bucket      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 875177878168                                                                            | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | 1:875177878168:web:aab00f4daa93442dd3a6ed                                               | Firebase app ID              |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | BFGqBZW0iZXOFD8S7k23A-qWvXAYiKcBfhuA9jV2v5A3cCnpDSAaHj_Z1gso_YpFt_MBOMO8GKU9f66n-RGjsiQ | VAPID key untuk web push     |

---

## 🚀 Instalasi & Menjalankan

### Prerequisites

| Software    | Versi |
| ----------- | ----- |
| **Node.js** | ≥ 18  |

### Instalasi

```bash
cd frontend

# Install dependencies
npm install
```

### Menjalankan

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

### Responsive Layout

| Breakpoint      | Layout                                                         |
| --------------- | -------------------------------------------------------------- |
| `< lg` (1024px) | Sidebar hidden, single column, TopBar hamburger menu           |
| `≥ lg`          | Sidebar visible (fixed 256px), main content area               |
| `< xl` (1280px) | Stacked layout: Camera → Counter → Chart → EventFeed           |
| `≥ xl`          | Grid 4 kolom: Camera+Counter (3 col) + EventFeed+Chart (1 col) |

---

> Bagian dari ekosistem **SAMTEK VMS** — lihat [root README](../README.md) untuk dokumentasi lengkap sistem.
