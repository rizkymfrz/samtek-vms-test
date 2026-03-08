<p align="center">
  <img src="frontend/public/logo.svg" width="80" alt="SAMTEK Logo" />
</p>

<h1 align="center">SAMTEK VMS</h1>
<h3 align="center">🚦 AI-Powered Video Management System</h3>

<p align="center">
  Sistem pemantauan lalu lintas real-time berbasis <strong>Computer Vision</strong> dan <strong>WebRTC</strong><br/>
  untuk deteksi, klasifikasi, dan penghitungan kendaraan secara otomatis.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-FF6F00?style=flat-square&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-WHEP-333333?style=flat-square&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
</p>

<p align="center">
  <img src="https://ztqkpxgzltzslyptpado.supabase.co/storage/v1/object/public/Gif/demo.gif" width="800" alt="SAMTEK VMS Demo" />
</p>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Project](#-struktur-project)
- [Sub-Project Breakdown](#-sub-project-breakdown)
  - [🤖 AI Service](#-ai-service--computer-vision-engine)
  - [⚙️ Backend](#️-backend--event-processing-hub)
  - [🖥️ Frontend](#️-frontend--real-time-dashboard)
  - [📡 Streaming](#-streaming--media-server)
- [Panduan Instalasi](#-panduan-instalasi)
- [Menjalankan Sistem](#-menjalankan-sistem)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)

---

## 🔍 Gambaran Umum

**SAMTEK VMS** adalah sistem Video Management System yang mengintegrasikan AI untuk memantau lalu lintas secara real-time. Sistem ini mampu:

1. **Mendeteksi & mengklasifikasikan** kendaraan (Mobil, Motor, Truk, Bus) dari feed CCTV menggunakan model **YOLOv8**
2. **Menghitung kendaraan** yang melintas garis virtual (_line-crossing detection_) dengan object tracking
3. **Mengirim push notification** otomatis ke browser saat truk terdeteksi melintas, melalui **Firebase Cloud Messaging**
4. **Menampilkan dashboard real-time** dengan live streaming video via **WebRTC (WHEP)**, overlay bounding box, grafik analitik, dan event feed

Seluruh pipeline — dari kamera ke layar — berjalan secara **end-to-end real-time** tanpa database tradisional, memanfaatkan in-memory store dan WebSocket untuk latensi minimum.

---

## 🏗 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SAMTEK VMS Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────┐     RTSP       ┌───────────────┐                    │
│   │  CCTV /       │──────────────▶ │  Streaming    │                    │
│   │  Video Source │                │   (MediaMTX)  │                    │
│   └───────────────┘                └───────────┬───┘                    │
│                                    │           │                        │
│                               RTSP │           │ WebRTC (WHEP)          │
│                                    ▼           │                        │
│                           ┌────────────────┐   │                        │
│                           │   AI Service   │   │                        │
│                           │   (Python /    │   │                        │
│                           │    YOLOv8)     │   │                        │
│                           └────────┬───────┘   │                        │
│                                    │           │                        │
│                          HTTP POST │           │                        │
│                        (detections │& events)  │                        │
│                                    ▼           │                        │
│                           ┌────────────────┐   │                        │
│                           │    Backend     │   │                        │
│                           │  (Express.js / │   │                        │
│                           │   Socket.IO)   │   │                        │
│                           └────────┬───────┘   │                        │
│                                    │           │                        │
│                    WebSocket +     │   FCM     │                        │
│                    REST API        │           │                        │
│                                    ▼           ▼                        │
│                           ┌──────────────────────┐                      │
│                           │       Frontend       │                      │
│                           │     (Next.js 16 /    │                      │
│                           │       React 19)      │                      │
│                           └──────────────────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Video Feed ──▶ MediaMTX (RTSP Re-stream) ──▶ AI Service (YOLOv8 Detection)
                        │                               │
                        │ WebRTC/WHEP                   │ HTTP POST
                        ▼                               ▼
                    Frontend    ◀── Socket.IO  ────  Backend (Express.js)
                    (Live Video)    (Real-time)         │
                                                        │ FCM Push
                                                        ▼
                                                Browser Notification
```

---

## ✨ Fitur Utama

| Kategori            | Fitur                  | Detail                                                                          |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| 🤖 **AI Detection** | Vehicle Classification | Deteksi 4 kelas: `mobil`, `motor`, `truk`, `bus` menggunakan YOLOv8n            |
| 🤖 **AI Detection** | Line-Crossing Counter  | Penghitungan kendaraan saat melintas garis virtual di tengah frame              |
| 🤖 **AI Detection** | Object Tracking        | Tracking berbasis nearest-neighbor (Euclidean distance) tanpa library eksternal |
| 🤖 **AI Detection** | Snapshot Capture       | Otomatis menyimpan screenshot saat truk terdeteksi melintas                     |
| 📡 **Streaming**    | WebRTC (WHEP)          | Live video ultra-low-latency dari MediaMTX ke browser                           |
| 📡 **Streaming**    | RTSP Relay             | Looping video simulasi via FFmpeg → RTSP stream                                 |
| 📡 **Streaming**    | Auto Fallback          | Otomatis fallback ke MP4 lokal jika WebRTC gagal                                |
| ⚙️ **Backend**      | WebSocket Broadcasting | Real-time event via Socket.IO (deteksi + crossing)                              |
| ⚙️ **Backend**      | Push Notifications     | Firebase Cloud Messaging untuk alert truk terdeteksi                            |
| ⚙️ **Backend**      | Input Validation       | Schema validation dengan Zod untuk semua incoming event                         |
| ⚙️ **Backend**      | Rate Limiting          | Proteksi endpoint dengan `express-rate-limit` (100 req/15min)                   |
| 🖥️ **Frontend**     | Detection Overlay      | Bounding box di atas live video (Canvas)                                        |
| 🖥️ **Frontend**     | Real-time Counter      | Counter kendaraan per kategori dengan animasi Framer Motion                     |
| 🖥️ **Frontend**     | Event Feed             | Live log setiap crossing event + snapshot image                                 |
| 🖥️ **Frontend**     | Analytics Chart        | Grafik area real-time (Recharts) menampilkan intensitas lalu lintas             |
| 🖥️ **Frontend**     | Toast Notifications    | Alert truk via Sonner toast dengan icon & timestamp                             |

---

## 🛠 Tech Stack

### AI Service (Python)

| Teknologi                | Versi  | Kegunaan                                  |
| ------------------------ | ------ | ----------------------------------------- |
| **Python**               | 3.10+  | Runtime                                   |
| **Ultralytics (YOLOv8)** | Latest | Object detection model                    |
| **OpenCV**               | Latest | Video capture, frame processing, snapshot |
| **NumPy**                | Latest | Array/matrix operations                   |
| **Requests**             | Latest | HTTP client untuk kirim event ke backend  |

### Backend (Node.js)

| Teknologi              | Versi | Kegunaan                               |
| ---------------------- | ----- | -------------------------------------- |
| **Express.js**         | 5.x   | HTTP framework                         |
| **Socket.IO**          | 4.x   | WebSocket real-time communication      |
| **Firebase Admin SDK** | 13.x  | Firebase Cloud Messaging (server-side) |
| **Zod**                | 4.x   | Runtime schema validation              |
| **Winston**            | 3.x   | Structured logging (console + file)    |
| **Helmet**             | 8.x   | HTTP security headers                  |
| **Morgan**             | 1.x   | HTTP request logging                   |
| **express-rate-limit** | 8.x   | API rate limiting                      |

### Frontend (Next.js)

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

### Streaming

| Teknologi    | Kegunaan                           |
| ------------ | ---------------------------------- |
| **MediaMTX** | Media server (RTSP → WebRTC relay) |
| **FFmpeg**   | Video encoding & RTSP publishing   |

---

## 📁 Struktur Project

```
samtek-vms-test/
├── ai-service/              # 🤖 Computer Vision Engine (Python)
│   ├── main.py              #    Entry point & debug visualization
│   ├── config.py            #    Konfigurasi (env vars, target classes)
│   ├── detector.py          #    YOLOv8 vehicle detector wrapper
│   ├── line_counter.py      #    Line-crossing counter + object tracker
│   ├── event_sender.py      #    Async HTTP event dispatcher
│   ├── stream_reader.py     #    Threaded video stream reader (auto-reconnect)
│   ├── requirements.txt     #    Python dependencies
│   └── yolov8n.pt           #    Pre-trained YOLOv8 nano model
│
├── backend/                 # ⚙️ Event Processing Hub (Node.js)
│   ├── src/
│   │   ├── server.js        #    HTTP server bootstrap + graceful shutdown
│   │   ├── app.js           #    Express app (middleware stack)
│   │   ├── config/          #    Environment config + Firebase credentials
│   │   ├── controllers/     #    Request handlers (events)
│   │   ├── services/        #    Business logic (event, FCM, notification)
│   │   ├── routes/          #    REST API routes
│   │   ├── validators/      #    Zod schema validation
│   │   ├── store/           #    In-memory event store (ring buffer)
│   │   ├── websocket/       #    Socket.IO initialization
│   │   ├── middleware/      #    Error handler
│   │   └── utils/           #    Winston logger
│   └── package.json
│
├── frontend/                # 🖥️ Real-time Dashboard (Next.js 16)
│   ├── app/
│   │   ├── layout.tsx       #    Root layout (Inter + Geist Mono fonts)
│   │   ├── page.tsx         #    Dashboard page (WebRTC, Socket.IO, FCM)
│   │   └── globals.css      #    Global styles + Tailwind
│   ├── components/
│   │   ├── dashboard/       #    Feature components
│   │   │   ├── CameraPanel.tsx     # Live video + canvas detection overlay
│   │   │   ├── VehicleCounter.tsx  # Counter cards per vehicle type
│   │   │   ├── EventFeed.tsx       # Scrollable crossing event log
│   │   │   ├── AnalyticsChart.tsx  # Real-time area chart (Recharts)
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   └── TopBar.tsx          # Status bar (connection, stream mode)
│   │   └── ui/              #    shadcn/ui primitives
│   ├── lib/
│   │   ├── firebase.ts      #    FCM token request & message listener
│   │   └── utils.ts         #    Utility functions (cn)
│   ├── hooks/
│   │   └── use-mobile.ts    #    Responsive breakpoint hook
│   ├── public/
│   │   ├── logo.svg         #    SAMTEK logo
│   │   ├── truck-icon.png   #    Push notification icon
│   │   └── firebase-messaging-sw.js  # Service worker untuk FCM
│   └── package.json
│
├── streaming/               # 📡 Media Server
│   ├── mediamtx.exe         #    MediaMTX binary
│   ├── mediamtx.yml         #    Server config (RTSP + WebRTC)
│   ├── start-stream.bat     #    Startup script dengan dependency check
│   └── traffic.mp4          #    Sample traffic video untuk simulasi
│
└── README.md                # 📖 Dokumentasi ini
```

---

## 📦 Sub-Project Breakdown

### 🤖 AI Service — Computer Vision Engine

> **Runtime:** Python 3.10+ &nbsp;|&nbsp; **Model:** YOLOv8n (Ultralytics) &nbsp;|&nbsp; **Input:** RTSP Stream

AI Service adalah engine yang menjalankan deteksi dan penghitungan kendaraan. Didesain modular dengan separation of concerns yang jelas.

#### Modul & Tanggung Jawab

| File               | Kelas / Fungsi           | Tanggung Jawab                                          |
| ------------------ | ------------------------ | ------------------------------------------------------- |
| `main.py`          | `main()`, `draw_debug()` | Entry point, main loop                                  |
| `detector.py`      | `VehicleDetector`        | Wrapper YOLOv8 — inference & filtering per target class |
| `line_counter.py`  | `LineCrossingCounter`    | Object tracking + line-crossing detection + snapshot    |
| `event_sender.py`  | `EventSender`            | Async HTTP POST ke backend (non-blocking via threading) |
| `stream_reader.py` | `VideoStream`            | Threaded video reader dengan auto-reconnect             |
| `config.py`        | —                        | Centralized configuration via environment variables     |

#### Cara Kerja Detection Pipeline

```
1. VideoStream membuka RTSP stream dari MediaMTX (threaded, auto-reconnect)
2. Setiap N frame (FRAME_SKIP), frame dikirim ke VehicleDetector
3. YOLOv8 mendeteksi objek → filter hanya kelas target (mobil/motor/truk/bus)
4. Hasil deteksi dikirim ke Backend via EventSender (async HTTP POST)
5. LineCrossingCounter melacak setiap objek
6. Saat objek melintas garis virtual → crossing event dikirim ke Backend
7. Jika objek = truk → otomatis capture snapshot frame
```

#### Target Classes

| COCO Class ID | Label   | Keterangan                              |
| :-----------: | ------- | --------------------------------------- |
|       2       | `mobil` | Sedan, SUV, Hatchback                   |
|       3       | `motor` | Sepeda motor                            |
|       5       | `bus`   | Bus                                     |
|       7       | `truk`  | Truk (trigger special event + snapshot) |

#### Environment Variables

| Variable               | Default                        | Keterangan                                             |
| ---------------------- | ------------------------------ | ------------------------------------------------------ |
| `VIDEO_SOURCE`         | `rtsp://localhost:8554/live`   | URL sumber video (RTSP)                                |
| `MODEL_PATH`           | `yolov8n.pt`                   | Path ke model YOLOv8                                   |
| `LINE_Y`               | `400`                          | Posisi Y garis virtual (auto-override ke tengah frame) |
| `BACKEND_URL`          | `http://localhost:5000/events` | Endpoint backend untuk kirim event                     |
| `FRAME_SKIP`           | `2`                            | Proses deteksi setiap N frame                          |
| `CONFIDENCE_THRESHOLD` | `0.1`                          | Minimum confidence score                               |

---

### ⚙️ Backend — Event Processing Hub

> **Runtime:** Node.js 18+ &nbsp;|&nbsp; **Framework:** Express.js 5 &nbsp;|&nbsp; **Real-time:** Socket.IO 4

Backend berperan sebagai hub pemrosesan event dari AI Service dan mendistribusikan data ke Frontend secara real-time.

#### Arsitektur (MVC-like)

```
src/
├── server.js           # HTTP server + graceful shutdown
├── app.js              # Express middleware stack
├── config/             # Environment & Firebase credentials
├── controllers/        # Request handler logic
│   └── events.controller.js
├── services/           # Business logic layer
│   ├── event.service.js        # Event processing + validation
│   ├── fcm.service.js          # Firebase Admin SDK wrapper
│   └── notification.service.js # Push notification dispatcher
├── routes/             # API routing
│   ├── events.routes.js
│   └── notification.routes.js
├── validators/         # Zod schema definitions
│   └── event.validator.js
├── store/              # In-memory data store
│   └── eventStore.js           # Ring buffer (max 100 events)
├── websocket/          # Socket.IO setup
│   └── socket.js
├── middleware/          # Error handling
│   └── errorHandler.js
└── utils/              # Winston logger
    └── logger.js
```

#### Middleware Stack

Middleware diaplikasikan secara berurutan untuk security dan monitoring:

```
Request → Helmet (Security Headers)
        → Morgan (HTTP Logging → Winston)
        → CORS (Whitelist Frontend URLs)
        → JSON Parser
        → Rate Limiter (100 req/15min, skip /events)
        → Routes → Controller → Service
        → Error Handler
```

#### API Endpoints

| Method | Endpoint                   | Deskripsi                                         | Rate Limited |
| ------ | -------------------------- | ------------------------------------------------- | :----------: |
| `POST` | `/events`                  | Menerima detection/crossing event dari AI Service |      ❌      |
| `GET`  | `/events`                  | Mengambil riwayat event terbaru (default 50)      |      ✅      |
| `GET`  | `/health`                  | Health check endpoint                             |      ✅      |
| `POST` | `/notifications/subscribe` | Subscribe FCM token ke topic `vehicle-alerts`     |      ✅      |
| `GET`  | `/snapshots/:filename`     | Static file serving untuk snapshot images         |      ✅      |

#### Event Flow

```
AI Service ──POST /events──▶ Controller
                                │
                    ┌───────────┴──────────────┐
                    ▼                          ▼
              type: "detections"     type: "vehicle_crossing"
                    │                          │
                    ▼                          ▼
              Socket.IO emit             Zod Validation
               "detections"                    │
                    │                          ▼
                    │                 In-Memory Store (push)
                    │                          │
                    │                          ▼
                    │              Socket.IO emit "vehicle_event"
                    │                          │
                    │                          ▼
                    │              if is_special_event (truk):
                    │                  → FCM Push Notification
                    ▼                          ▼
                Frontend                Frontend + Browser
            (Canvas Overlay)        (Event Feed + Toast + Push)
```

#### In-Memory Store

Sistem menggunakan **ring buffer** untuk menyimpan maximal 100 event terbaru di memory, tanpa database. Desain ini dipilih karena:

- ⚡ Latensi baca/tulis mendekati nol
- 🎯 Fokus pada real-time monitoring
- 🧹 Auto-cleanup: event lama otomatis terhapus saat buffer penuh

---

### 🖥️ Frontend — Real-time Dashboard

> **Framework:** Next.js 16 (App Router) &nbsp;|&nbsp; **UI:** React 19 + shadcn/ui &nbsp;|&nbsp; **Charts:** Recharts

Dashboard single-page yang menampilkan seluruh informasi monitoring lalu lintas secara real-time.

#### Component Architecture

```
Dashboard (page.tsx)
├── Sidebar              # Navigasi utama + status sistem
├── TopBar               # Connection status + stream mode indicator
├── CameraPanel          # Live video (WebRTC) + canvas overlay
│   ├── <video>          # WebRTC WHEP stream
│   └── <canvas>         # Detection bounding boxes + scan line
├── VehicleCounter       # 4 counter cards (mobil/motor/truk/bus)
├── EventFeed            # Scrollable event log + snapshot images
└── AnalyticsChart       # Real-time area chart (kendaraan per menit)
```

#### Koneksi Real-time (3 Channel)

| Channel                | Protokol                 | Tujuan                                     |
| ---------------------- | ------------------------ | ------------------------------------------ |
| **Live Video**         | WebRTC (WHEP) → MediaMTX | Menampilkan feed CCTV di `<video>` element |
| **Detection Data**     | Socket.IO → Backend      | Menerima bounding box & crossing events    |
| **Push Notifications** | Firebase Cloud Messaging | Browser notification saat truk terdeteksi  |

#### Canvas Detection Overlay

`CameraPanel` merender bounding box di atas video menggunakan HTML5 Canvas:

- **Corner-style boxes** — Setiap deteksi ditampilkan dengan garis sudut
- **Color-coded** — Truk merah (`#ef4444`), kendaraan lain biru (`#0ea5e9`)
- **Glow effect** — Shadow blur di sekitar bounding box
- **Garis deteksi** — Dashed line merah di tengah frame (`GARIS DETEKSI`)

#### Firebase Cloud Messaging (FCM)

```
Frontend                          Backend                    Firebase
   │                                │                           │
   ├── requestFCMToken() ─────────▶│                           │
   │   (Notification.requestPermission)                         │
   │                                │                           │
   ├── POST /notifications/subscribe│                           │
   │   { token: "..." }             │── subscribeToTopic() ───▶│
   │                                │   ("vehicle-alerts")      │
   │                                │                           │
   │   [Saat truk crossing]         │                           │
   │                                │── sendToTopic() ────────▶│
   │                                │   (title, body, image)    │
   │◀─── FCM Push ─────────────────│◀───────────────────────── │
   │   → Browser Notification       │                           │
```

---

### 📡 Streaming — Media Server

> **Engine:** MediaMTX (bluenviron) &nbsp;|&nbsp; **Codec:** H.264 (libx264)

Streaming server bertanggung jawab menyediakan video feed untuk kedua consumer: AI Service (via RTSP) dan Frontend (via WebRTC).

#### Konfigurasi Protokol

| Protokol   | Port    |   Status    | Consumer                                     |
| ---------- | ------- | :---------: | -------------------------------------------- |
| **RTSP**   | `:8554` |  ✅ Aktif   | AI Service (`rtsp://localhost:8554/live`)    |
| **WebRTC** | `:8889` |  ✅ Aktif   | Frontend (`http://localhost:8889/live/whep`) |
| **RTMP**   | —       | ❌ Nonaktif | —                                            |
| **HLS**    | —       | ❌ Nonaktif | —                                            |
| **SRT**    | —       | ❌ Nonaktif | —                                            |

#### FFmpeg Pipeline

```bash
ffmpeg -re -stream_loop -1 -i traffic.mp4 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -bf 0 -profile:v baseline -an \
  -f rtsp rtsp://localhost:8554/live
```

| Parameter             | Keterangan                                 |
| --------------------- | ------------------------------------------ |
| `-re`                 | Real-time playback speed                   |
| `-stream_loop -1`     | Loop video tanpa henti                     |
| `-preset ultrafast`   | Encoding speed tercepat (minimize latency) |
| `-tune zerolatency`   | Optimasi untuk real-time streaming         |
| `-bf 0`               | Tanpa B-frames (reduce delay)              |
| `-profile:v baseline` | Profil kompatibel untuk WebRTC             |
| `-an`                 | Audio dinonaktifkan                        |

#### Dependency Check

Script `start-stream.bat` melakukan validasi sebelum menjalankan server:

1. ✅ `mediamtx.exe` tersedia di folder
2. ✅ `ffmpeg` terinstall dan ada di PATH
3. ✅ `traffic.mp4` tersedia sebagai sumber video

---

## 🚀 Panduan Instalasi

### Prerequisites

| Software    | Versi  | Link                              |
| ----------- | ------ | --------------------------------- |
| **Node.js** | ≥ 18   | [nodejs.org](https://nodejs.org/) |
| **Python**  | ≥ 3.10 | [python.org](https://python.org/) |
| **FFmpeg**  | Latest | `winget install ffmpeg`           |

### 1. Clone Repository

```bash
git clone https://github.com/rizkymfrz/samtek-vms-test.git
cd samtek-vms-test
```

### 2. Setup AI Service

```bash
cd ai-service

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

---

## ▶️ Menjalankan Sistem

> Jalankan setiap service di terminal terpisah sesuai urutan berikut.

### Terminal 1 — Streaming Server

```bash
cd streaming
start-stream.bat
```

### Terminal 2 — Backend

```bash
cd backend
npm run dev
```

### Terminal 3 — AI Service

```bash
cd ai-service
python main.py
```

### Terminal 4 — Frontend

```bash
cd frontend
npm run dev
```

### Verifikasi

| Check          | URL / Endpoint                    | Expected               |
| -------------- | --------------------------------- | ---------------------- |
| Backend Health | `http://localhost:5000/health`    | `{"status":"ok"}`      |
| Streaming RTSP | `rtsp://localhost:8554/live`      | Video stream aktif     |
| WebRTC WHEP    | `http://localhost:8889/live/whep` | WHEP endpoint ready    |
| Dashboard      | `http://localhost:3000`           | Dashboard + live video |

---

## 📡 API Reference

### `POST /events`

Menerima event dari AI Service. Mendukung dua tipe payload:

**Detection Stream** — Dikirim setiap N frame, berisi bounding box semua objek yang terdeteksi.

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

**Vehicle Crossing** — Dikirim saat kendaraan melintas garis virtual.

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

### `GET /events?limit=50`

Mengambil riwayat crossing event terbaru.

### `POST /notifications/subscribe`

Subscribe FCM token ke topic `vehicle-alerts`.

---

## 🔌 WebSocket Events

| Event Name      | Direction       | Payload                                                    | Trigger                         |
| --------------- | --------------- | ---------------------------------------------------------- | ------------------------------- |
| `detections`    | Server → Client | `{ frame_width, frame_height, objects[] }`                 | Setiap N frame dari AI Service  |
| `vehicle_event` | Server → Client | `{ id, vehicle, confidence, timestamp, is_special_event }` | Setiap kendaraan melintas garis |

---

Dibangun sebagai submission Technical Test — mendemonstrasikan kemampuan full-stack engineering dengan integrasi AI/Computer Vision, real-time communication, dan modern web development dalam satu ekosistem.

---
