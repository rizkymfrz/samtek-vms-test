"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { requestFCMToken, setupMessageListener } from "../lib/firebase";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { CameraPanel } from "@/components/dashboard/CameraPanel";
import { VehicleCounter } from "@/components/dashboard/VehicleCounter";
import { EventFeed } from "@/components/dashboard/EventFeed";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const WEBRTC_WHEP_URL =
  process.env.NEXT_PUBLIC_WEBRTC_WHEP_URL || "http://localhost:8889/live/whep";

interface DetectionObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}
interface DetectionPayload {
  frame_width: number;
  frame_height: number;
  objects: DetectionObject[];
}
interface CrossingEvent {
  id: string;
  vehicle: string;
  confidence: number;
  timestamp: string;
  is_special_event: boolean;
  created_at?: string;
}

async function connectWebRTC(
  videoEl: HTMLVideoElement,
  onFail: () => void,
): Promise<RTCPeerConnection | null> {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.ontrack = (evt) => {
      videoEl.srcObject = evt.streams[0];
      videoEl
        .play()
        .catch((e) => console.warn("[VMS] WebRTC Auto-play failed:", e));
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const localSdp: string = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(pc.localDescription?.sdp ?? "");
      }, 3000);
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timeout);
        resolve(pc.localDescription?.sdp ?? "");
      } else {
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(timeout);
            resolve(pc.localDescription?.sdp ?? "");
          }
        };
      }
    });
    const res = await fetch(WEBRTC_WHEP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: localSdp,
    });
    if (!res.ok) throw new Error(`WHEP responded ${res.status}`);
    const answerSdp = await res.text();
    await pc.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("WebRTC connection timeout")),
        5000,
      );
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          clearTimeout(timeout);
          resolve();
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          clearTimeout(timeout);
          reject(new Error(`WebRTC ${pc.connectionState}`));
        }
      };
      if (pc.connectionState === "connected") {
        clearTimeout(timeout);
        resolve();
      }
    });
    console.log("[VMS] WebRTC connected to MediaMTX");
    return pc;
  } catch (err) {
    console.warn("[VMS] WebRTC failed, falling back to mp4:", err);
    onFail();
    return null;
  }
}

export default function Dashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [streamMode, setStreamMode] = useState<"webrtc" | "mp4" | "connecting">(
    "connecting",
  );
  const [latestDetections, setLatestDetections] =
    useState<DetectionPayload | null>(null);
  const [crossingEvents, setCrossingEvents] = useState<CrossingEvent[]>([]);
  const [counts, setCounts] = useState({ mobil: 0, motor: 0, truk: 0, bus: 0 });
  const [chartData, setChartData] = useState<{ time: string; count: number }[]>(
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    connectWebRTC(video, () => {}).then((pc) => {
      if (pc) {
        pcRef.current = pc;
        setStreamMode("webrtc");
      }
    });
    return () => {
      pcRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("detections", (data: DetectionPayload) => {
      setLatestDetections(data);
    });
    socket.on("vehicle_event", (data: CrossingEvent) => {
      setCrossingEvents((prev) => [data, ...prev].slice(0, 50));
      setCounts((prev) => ({
        ...prev,
        [data.vehicle]: (prev[data.vehicle as keyof typeof prev] || 0) + 1,
      }));
      setChartData((prev) => {
        const timeStr = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.time === timeStr) {
          return [
            ...prev.slice(0, -1),
            { ...lastEntry, count: lastEntry.count + 1 },
          ];
        }
        const newData = [...prev, { time: timeStr, count: 1 }];
        return newData.slice(-15);
      });
      if (data.is_special_event) {
        toast.error(
          `Truk Terdeteksi (${(data.confidence * 100).toFixed(0)}%)`,
          {
            description: new Date(data.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
            icon: "🚛",
          },
        );
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    requestFCMToken().then((token) => {
      if (token) {
        fetch(`${BACKEND_URL}/notifications/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch((err) =>
          console.error("[VMS] Failed to subscribe FCM token", err),
        );
      }
    });
    const unsubscribe = setupMessageListener((payload) => {
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "Alert", {
          body: payload.notification?.body || "Vehicle crossing",
          icon: "/truck-icon.png",
          data: payload.data,
        });
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <div className="bg-[#020617] text-slate-50 font-sans">
      <Toaster theme="dark" position="bottom-right" />
      <div className="fixed top-0 left-0 bottom-0 w-64 hidden lg:block border-r border-[#1e293b] z-50">
        <Sidebar className="h-full w-full" />
      </div>
      <main className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar
          connected={connected}
          streamMode={streamMode}
          className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md"
        />
        <div className="p-4 lg:p-6 pb-20">
          <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 flex flex-col gap-6">
              <CameraPanel
                streamMode={streamMode}
                videoRef={videoRef}
                canvasRef={canvasRef}
                latestDetections={latestDetections}
              />
              <VehicleCounter counts={counts} />
              <div className="xl:hidden">
                <AnalyticsChart data={chartData} />
              </div>
            </div>
            <div className="xl:col-span-1 relative hidden xl:block">
              <div className="absolute inset-0 flex flex-col gap-6">
                <div className="flex-1 min-h-0">
                  <EventFeed events={crossingEvents} />
                </div>
                <div className="shrink-0 h-[280px]">
                  <AnalyticsChart data={chartData} />
                </div>
              </div>
            </div>
            <div className="xl:hidden flex flex-col gap-6">
              <div className="h-[400px]">
                <EventFeed events={crossingEvents} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
