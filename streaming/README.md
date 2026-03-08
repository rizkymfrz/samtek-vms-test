<h1 align="center">📡 Streaming</h1>
<h3 align="center">Media Server — RTSP & WebRTC Video Relay</h3>

<p align="center">
  Streaming server yang menyediakan video feed untuk AI Service (RTSP)<br/>
  dan Frontend (WebRTC/WHEP) menggunakan <strong>MediaMTX</strong> dan <strong>FFmpeg</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MediaMTX-Latest-4285F4?style=flat-square&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/FFmpeg-Latest-007808?style=flat-square&logo=ffmpeg&logoColor=white" />
  <img src="https://img.shields.io/badge/RTSP-8554-333333?style=flat-square" />
  <img src="https://img.shields.io/badge/WebRTC-WHEP-333333?style=flat-square&logo=webrtc&logoColor=white" />
</p>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur](#-arsitektur)
- [Struktur File](#-struktur-file)
- [Protokol & Port](#-protokol--port)
- [FFmpeg Pipeline](#-ffmpeg-pipeline)
- [Startup Script](#-startup-script)
- [Consumer Integration](#-consumer-integration)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)

---

## 🔍 Gambaran Umum

Streaming server adalah **media relay** dalam ekosistem SAMTEK VMS yang berperan:

1. **Menerima video source** — Dalam mode simulasi, FFmpeg membaca `traffic.mp4` dan mem-publish ke RTSP
2. **RTSP relay** — Menyediakan RTSP stream untuk AI Service (OpenCV `VideoCapture`)
3. **WebRTC bridge** — Mengkonversi RTSP ke WebRTC (WHEP) untuk Frontend browser
4. **Looping otomatis** — Video simulasi diputar berulang tanpa henti

Dalam production, FFmpeg diganti dengan feed CCTV asli yang langsung push ke RTSP endpoint MediaMTX.

---

## 🏗 Arsitektur

```
┌──────────────────────────────────────────────────────────────────┐
│                        Streaming Server                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐         RTSP Push          ┌───────────────┐   │
│   │  FFmpeg     │ ─────────────────────────▶ │   MediaMTX    │   │
│   │  (encoder)  │   rtsp://localhost:8554    │   (server)    │   │
│   │             │          /live             │               │   │
│   │traffic.mp4  │                            │  ┌─────────┐  │   │
│   │             │                            │  │  RTSP   │  │   │
│   └─────────────┘                            │  │  :8554  │──┼──▶ AI Service
│                                              │  └─────────┘  │   │
│                                              │               │   │
│                                              │  ┌─────────┐  │   │
│                                              │  │ WebRTC  │  │   │
│                                              │  │  :8889  │──┼──▶ Frontend (WHEP)
│                                              │  └─────────┘  │   │
│                                              │               │   │
│                                              │  RTMP  ❌     │   │
│                                              │  HLS   ❌     │   │
│                                              │  SRT   ❌     │   │
│                                              └───────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
                              ┌──────────────┐
                              │  MediaMTX    │
                              │  (Relay)     │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼─────────────────┐
                    │                │                 │
              ┌─────▼─────┐   ┌───── ▼─────┐           │
              │   RTSP    │   │   WebRTC   │           │
              │   :8554   │   │   :8889    │           │
              └─────┬─────┘   └──────┬─────┘           │
                    │                │                 │
                    ▼                ▼                 │
              ┌───────────┐   ┌───────────┐            │
              │AI Service │   │ Frontend  │            │
              │ (OpenCV)  │   │  (WHEP)   │            │
              └───────────┘   └───────────┘            │
                                                       │
traffic.mp4 ──▶ FFmpeg (encode) ──▶ RTSP Push  ───────┘
```

---

## 📁 Struktur File

```
streaming/
├── mediamtx.exe           # MediaMTX binary (media server)
├── mediamtx.yml           # Server configuration
├── start-stream.bat       # Startup script dengan dependency check
└── traffic.mp4            # Sample traffic video untuk simulasi
```

| File               | Size   | Keterangan                                |
| ------------------ | ------ | ----------------------------------------- |
| `mediamtx.exe`     | ~50 MB | Pre-compiled binary (Windows)             |
| `mediamtx.yml`     | 520 B  | YAML config untuk protokol & paths        |
| `start-stream.bat` | 1.7 KB | Batch script dengan validasi dependencies |
| `traffic.mp4`      | ~9 MB  | Video lalu lintas untuk simulasi          |

---

## 🌐 Protokol & Port

| Protokol   | Port    |   Status    | Consumer   | Endpoint                          |
| ---------- | ------- | :---------: | ---------- | --------------------------------- |
| **RTSP**   | `:8554` |  ✅ Aktif   | AI Service | `rtsp://localhost:8554/live`      |
| **WebRTC** | `:8889` |  ✅ Aktif   | Frontend   | `http://localhost:8889/live/whep` |
| **RTMP**   | —       | ❌ Nonaktif | —          | —                                 |
| **HLS**    | —       | ❌ Nonaktif | —          | —                                 |
| **SRT**    | —       | ❌ Nonaktif | —          | —                                 |

### WebRTC Ports

| Port    | Protokol | Kegunaan                |
| ------- | -------- | ----------------------- |
| `:8889` | HTTP     | WHEP signaling endpoint |
| `:8189` | UDP      | WebRTC media (RTP)      |
| `:8189` | TCP      | WebRTC media fallback   |

---

## 🎬 FFmpeg Pipeline

MediaMTX secara otomatis menjalankan FFmpeg saat path `/live` diakses pertama kali:

```bash
ffmpeg -re -stream_loop -1 -i traffic.mp4 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -bf 0 -profile:v baseline -an \
  -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
```

### Parameter Breakdown

| Parameter      | Nilai         | Keterangan                         |
| -------------- | ------------- | ---------------------------------- |
| `-re`          | —             | Real-time playback speed           |
| `-stream_loop` | `-1`          | Loop video tanpa batas             |
| `-i`           | `traffic.mp4` | Input video file                   |
| `-c:v`         | `libx264`     | H.264 video codec                  |
| `-preset`      | `ultrafast`   | Encoding speed tercepat            |
| `-tune`        | `zerolatency` | Optimasi untuk real-time streaming |
| `-bf`          | `0`           | Tanpa B-frames (reduce delay)      |
| `-profile:v`   | `baseline`    | Profil kompatibel untuk WebRTC     |
| `-an`          | —             | Audio dinonaktifkan                |
| `-f`           | `rtsp`        | Output format RTSP                 |

---

## 🚀 Startup Script

### `start-stream.bat`

Script batch yang menjalankan server dengan dependency checking:

```
start-stream.bat
      │
      ├──▶ [1] Check mediamtx.exe  ── Tidak ada? → Error + download link
      │
      ├──▶ [2] Check ffmpeg         ── Tidak ada? → Error + install guide
      │
      ├──▶ [3] Check traffic.mp4    ── Tidak ada? → Error + copy instruction
      │
      ├──▶ [4] Tampilkan info endpoint
      │         RTSP   ──  rtsp://localhost:8554/live
      │         WebRTC ──  http://localhost:8889/live
      │         WHEP   ──  http://localhost:8889/live/whep
      │
      └──▶ [5] Jalankan: mediamtx.exe mediamtx.yml
```

### Error Messages

| Check    | Error                      | Solusi                                                                                    |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `ffmpeg` | `ffmpeg not found in PATH` | `winget install ffmpeg` atau download dari [ffmpeg.org](https://ffmpeg.org/download.html) |

---

## 🔗 Consumer Integration

### AI Service (RTSP)

AI Service membaca stream via OpenCV `VideoCapture`:

```python
# ai-service/config.py
VIDEO_SOURCE = "rtsp://localhost:8554/live"

# ai-service/stream_reader.py
stream = cv2.VideoCapture(VIDEO_SOURCE)
stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
```

### Frontend (WebRTC/WHEP)

Frontend terhubung via WebRTC WHEP protocol:

```typescript
// frontend/app/page.tsx
const WEBRTC_WHEP_URL = "http://localhost:8889/live/whep";

const res = await fetch(WEBRTC_WHEP_URL, {
  method: "POST",
  headers: { "Content-Type": "application/sdp" },
  body: localSdp,
});
const answerSdp = await res.text();
await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
```

### WHEP Protocol

```
Browser                              MediaMTX
   │                                    │
   │  POST /live/whep                   │
   │  Content-Type: application/sdp     │
   │  Body: SDP Offer ────────────────▶ │
   │                                    │
   │  200 OK                            │
   │  Content-Type: application/sdp     │
   │  Body: SDP Answer ◀──────────────  │
   │                                    │
   │  WebRTC Media (RTP/UDP)            │
   │  ◀═══════════════════════════════▶│
   │     (video stream)                 │
```

---

## 🚀 Instalasi & Menjalankan

### Prerequisites

| Software   | Link                                                           |
| ---------- | -------------------------------------------------------------- |
| **FFmpeg** | `winget install ffmpeg` atau [ffmpeg.org](https://ffmpeg.org/) |

### Menjalankan

```bash
# Menggunakan startup script (recommended)
start-stream.bat

# Atau langsung
mediamtx.exe mediamtx.yml
```

### Verifikasi

| Check          | Cara                                      | Expected                 |
| -------------- | ----------------------------------------- | ------------------------ |
| Server running | Lihat terminal output                     | `"Starting MediaMTX..."` |
| RTSP stream    | `ffplay rtsp://localhost:8554/live`       | Video terputar           |
| WebRTC WHEP    | Buka browser `http://localhost:8889/live` | Stream info page         |

---

> Bagian dari ekosistem **SAMTEK VMS** — lihat [root README](../README.md) untuk dokumentasi lengkap sistem.
