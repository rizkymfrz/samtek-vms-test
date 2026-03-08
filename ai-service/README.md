<h1 align="center">🤖 AI Service</h1>
<h3 align="center">Computer Vision Engine — Vehicle Detection & Counting</h3>

<p align="center">
  Engine deteksi dan penghitungan kendaraan real-time menggunakan <strong>YOLOv8</strong>,<br/>
  dengan object tracking dan line-crossing detection dari feed RTSP.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-FF6F00?style=flat-square&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-4.x-5C3EE8?style=flat-square&logo=opencv&logoColor=white" />
</p>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur](#-arsitektur)
- [Tech Stack](#-tech-stack)
- [Struktur File](#-struktur-file)
- [Detection Pipeline](#-detection-pipeline)
- [Object Tracking](#-object-tracking)
- [Target Classes](#-target-classes)
- [Event Types](#-event-types)
- [Debug Visualization](#-debug-visualization)
- [Konfigurasi](#-konfigurasi)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)

---

## 🔍 Gambaran Umum

AI Service adalah modul Computer Vision dalam ekosistem **SAMTEK VMS** yang bertanggung jawab untuk:

1. **Membaca video stream** dari RTSP source (MediaMTX) secara threaded dengan auto-reconnect
2. **Mendeteksi kendaraan** menggunakan model YOLOv8n — mengklasifikasikan ke 4 kelas (mobil, motor, truk, bus)
3. **Melacak objek** antar frame
4. **Menghitung kendaraan** yang melintas garis virtual di tengah frame (line-crossing detection)
5. **Mengirim event** ke Backend secara async via HTTP POST (non-blocking)
6. **Menyimpan snapshot** otomatis saat truk terdeteksi melintas garis

---

## 🏗 Arsitektur

```
                    ┌───────────────────────────────────────────┐
                    │                AI Service                 │
                    ├───────────────────────────────────────────┤
                    │                                           │
  RTSP Stream       │   ┌───────────────┐                       │
  (MediaMTX)  ─────▶│   │ VideoStream   │  (Threaded Reader)    │
                    │   │ auto-reconnect│                       │
                    │   └──────┬────────┘                       │
                    │          │ frame                          │
                    │          ▼                                │
                    │   ┌──────────────────┐                    │
                    │   │ VehicleDetector  │  (YOLOv8 Inference)│
                    │   │ filter by class  │                    │
                    │   └──────┬───────────┘                    │
                    │          │ detections[]                   │
                    │          ▼                                │
                    │   ┌───────────────────┐    ┌────────────┐ │
                    │   │LineCrossingCounter│──▶ │ Snapshot   │ │
                    │   │ track + count     │    │ (truk only)│ │
                    │   └──────┬────────────┘    └────────────┘ │
                    │          │ events                         │
                    │          ▼                                │
                    │   ┌──────────────┐                        │
                    │   │ EventSender  │  (Async HTTP POST)     │
                    │   │ (threading)  │──────────────▶ Backend │
                    │   └──────────────┘                        │
                    │                                           │
                    │   ┌──────────────┐                        │
                    │   │  draw_debug  │  (Optional HUD)        │
                    │   │  (cv2 window)│                        │
                    │   └──────────────┘                        │
                    │                                           │
                    └───────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Teknologi                | Versi  | Kegunaan                                       |
| ------------------------ | ------ | ---------------------------------------------- |
| **Python**               | 3.10+  | Runtime                                        |
| **Ultralytics (YOLOv8)** | Latest | Object detection & classification              |
| **OpenCV**               | Latest | Video capture, frame processing, snapshot save |
| **NumPy**                | Latest | Array & matrix operations                      |
| **Requests**             | Latest | HTTP client untuk kirim event ke backend       |

---

## 📁 Struktur File

```
ai-service/
├── main.py              # Entry point, main loop, debug HUD overlay
├── config.py            # Konfigurasi terpusat (env vars, target classes)
├── detector.py          # YOLOv8 vehicle detector wrapper
├── line_counter.py      # Object tracking + line-crossing counter + snapshot
├── event_sender.py      # Async HTTP event dispatcher (threading)
├── stream_reader.py     # Threaded video stream reader (auto-reconnect)
├── requirements.txt     # Python dependencies
└── yolov8n.pt           # Pre-trained YOLOv8 nano model (6.5 MB)
```

---

## 🔄 Detection Pipeline

```
┌─────────┐    frame    ┌──────────────┐   detections[]   ┌───────────────┐
│ Video   │───────────▶ │   YOLOv8     │────────────────▶│ Line-Crossing │
│ Stream  │  (setiap N) │  Inference   │                  │ Counter       │
│ (RTSP)  │             │  + Filter    │                  │ + Tracker     │
└─────────┘             └──────────────┘                  └──────┬────────┘
                                │                                │
                                │ detection payload              │ crossing
                                │      events                    │
                                ▼                                ▼
                        ┌──────────────┐                 ┌──────────────┐
                        │ EventSender  │                 │ EventSender  │
                        │ POST /events │                 │ POST /events │
                        │ (async)      │                 │ (async)      │
                        └──────┬───────┘                 └──────┬───────┘
                               │                                │
                               └────────────┬───────────────────┘
                                            ▼
                                    Backend (Express.js)
                                    → Socket.IO broadcast
                                    → FCM notification (truk)
```

---

## 🎯 Object Tracking

AI Service menggunakan **simple nearest-neighbor tracking** tanpa library eksternal:

| Parameter           | Nilai  | Keterangan                                              |
| ------------------- | ------ | ------------------------------------------------------- |
| `max_distance`      | 200 px | Jarak maksimum untuk match objek antar frame            |
| `max_missed_frames` | 10     | Frame tanpa deteksi sebelum objek dihapus dari tracking |

### Mekanisme

```
Frame N:          Frame N+1:         Result:
  ┌───┐              ┌───┐
  │ A │ (200, 300)   │ ? │ (210, 310)   → Match A
  └───┘              └───┘
  ┌───┐              ┌───┐
  │ B │ (500, 400)   │ ? │ (505, 395)   → Match B
  └───┘              └───┘
                     ┌───┐
                     │ ? │ (100, 100)   → New object C (no match)
                     └───┘
```

### Line-Crossing Detection

```
         previous_y < line_y
              ┌───┐ ↓
              │ A │ ───── Crossed DOWN ✓ (counted!)
              └───┘
  ─────────── LINE_Y ──────────────────────────
              ┌───┐ ↑
              │ B │ ───── Crossed UP ✓ (counted!)
              └───┘
         previous_y > line_y
```

Kendaraan dihitung saat `previous_y` dan `current_y` berada di sisi berlawanan dari `line_y`, dan hanya dihitung sekali per objek (`counted` flag).

---

## 🚗 Target Classes

Hanya 4 kelas dari COCO dataset yang diproses, sisanya difilter:

| COCO ID | Label   | Emoji | Trigger Special Event |
| :-----: | ------- | :---: | :-------------------: |
|    2    | `mobil` |  🚗   |          ❌           |
|    3    | `motor` |  🏍️   |          ❌           |
|    5    | `bus`   |  🚌   |          ❌           |
|    7    | `truk`  |  🚛   |     ✅ + Snapshot     |

**Special Event (Truk):**

- Saat truk melintas garis → `is_special_event: true`
- Snapshot frame disimpan otomatis
- Backend mengirim push notification via Firebase Cloud Messaging

---

## 📡 Event Types

AI Service mengirim dua tipe event ke Backend (`POST /events`):

### 1. Detection Stream

Dikirim setiap N frame, berisi semua objek yang terdeteksi di frame tersebut.

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
    },
    {
      "class": "truk",
      "confidence": 0.92,
      "bbox": [400, 200, 600, 400],
      "center_x": 500.0,
      "center_y": 300.0
    }
  ]
}
```

### 2. Vehicle Crossing

Dikirim saat satu kendaraan melintas garis virtual.

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

| Field              | Tipe    | Keterangan                                  |
| ------------------ | ------- | ------------------------------------------- |
| `vehicle`          | string  | Nama kelas kendaraan                        |
| `confidence`       | float   | Confidence score deteksi (0-1)              |
| `timestamp`        | string  | ISO 8601 UTC timestamp                      |
| `image`            | string  | Nama file snapshot (kosong jika bukan truk) |
| `is_special_event` | boolean | `true` hanya untuk truk                     |

---

## 🖥️ Debug Visualization

Saat `DISPLAY_DEBUG = True`, AI Service membuka OpenCV window dengan HUD overlay:

```
┌──────────────────────────────────────────────┐
│ SAMTEK AI                               LIVE │  ← HUD bar
│ VEHICLES: 5                                  │
├──────────────────────────────────────────────┤
│                                              │
│       ┌─     ─┐                              │
│       │ MOBIL │ 87%    ← Label + confidence  │
│       │       │        ← Corner-style box    │
│       └─     ─┘                              │
│                                              │
│ SCAN LINE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← Garis deteksi (tengah)
│                                              │
│       ┌─      ─┐                             │
│       │  TRUK  │ 92%    ← Warna merah (truk) │
│       └─      ─┘                             │
│                                              │
└──────────────────────────────────────────────┘
```

**Color Coding:**

- Truk: Warna oranye (`0, 80, 255` BGR)
- Kendaraan lain: Warna kuning (`255, 200, 0` BGR)
- Scan line: Hijau cyan (`0, 255, 180` BGR)

---

## ⚙️ Konfigurasi

### Environment Variables

| Variable               | Default                        | Keterangan                                             |
| ---------------------- | ------------------------------ | ------------------------------------------------------ |
| `VIDEO_SOURCE`         | `rtsp://localhost:8554/live`   | URL sumber video (RTSP)                                |
| `MODEL_PATH`           | `yolov8n.pt`                   | Path ke model YOLOv8                                   |
| `LINE_Y`               | `400`                          | Posisi Y garis virtual (auto-override ke tengah frame) |
| `BACKEND_URL`          | `http://localhost:5000/events` | Endpoint backend untuk kirim event                     |
| `FRAME_SKIP`           | `2`                            | Proses deteksi setiap N frame                          |
| `CONFIDENCE_THRESHOLD` | `0.1`                          | Minimum confidence score                               |
| `SNAPSHOT_DIR`         | `snapshots/`                   | Direktori penyimpanan snapshot                         |

### Internal Flags

| Flag              | Default | Keterangan                         |
| ----------------- | ------- | ---------------------------------- |
| `ENABLE_SNAPSHOT` | `True`  | Simpan snapshot saat truk crossing |
| `ENABLE_LOGGING`  | `False` | Print log ke console               |
| `DISPLAY_DEBUG`   | `False` | Tampilkan OpenCV debug window      |

> **Note:** `LINE_Y` di config berfungsi sebagai fallback. Saat runtime, garis virtual diatur otomatis ke **tengah frame** (`frame_height // 2`).

---

## 🚀 Instalasi & Menjalankan

### Prerequisites

| Software   | Versi  |
| ---------- | ------ |
| **Python** | ≥ 3.10 |
| **FFmpeg** | Latest |

### Instalasi

```bash
cd ai-service
pip install -r requirements.txt
```

### Dependencies (`requirements.txt`)

```
ultralytics
opencv-python
numpy
requests
```

### Menjalankan

```bash
# Pastikan Streaming Server (MediaMTX) sudah berjalan terlebih dahulu

# Mode production (tanpa debug window)
python main.py

# Mode debug (dengan OpenCV window)
# Set DISPLAY_DEBUG = True dan ENABLE_LOGGING = True di config.py
python main.py
```

### Menjalankan dengan Custom Config

```bash
# Menggunakan environment variables
set VIDEO_SOURCE=rtsp://192.168.1.100:8554/cam1
set FRAME_SKIP=2
set CONFIDENCE_THRESHOLD=0.1
python main.py
```

---

> Bagian dari ekosistem **SAMTEK VMS** — lihat [root README](../README.md) untuk dokumentasi lengkap sistem.
