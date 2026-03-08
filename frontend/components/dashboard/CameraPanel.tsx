import { useEffect, useCallback } from "react";
import { Maximize2, Camera as CameraIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
interface CameraPanelProps {
  streamMode: "webrtc" | "mp4" | "connecting";
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  latestDetections: DetectionPayload | null;
}

export function CameraPanel({
  streamMode,
  videoRef,
  canvasRef,
  latestDetections,
}: CameraPanelProps) {
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !latestDetections) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = latestDetections.frame_width;
    canvas.height = latestDetections.frame_height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const lineY = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(canvas.width, lineY);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(239, 68, 68, 1)";
    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.fillText("GARIS DETEKSI (TENGAH)", 10, lineY - 8);
    latestDetections.objects.forEach((obj) => {
      const [x1, y1, x2, y2] = obj.bbox;
      const w = x2 - x1;
      const h = y2 - y1;
      const isTruck = obj.class === "truk";
      const color = isTruck ? "#ef4444" : "#0ea5e9";
      const glowColor = isTruck
        ? "rgba(239, 68, 68, 0.5)"
        : "rgba(14, 165, 233, 0.4)";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const cornerLen = Math.max(12, Math.floor(Math.min(w, h) / 4));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + cornerLen, y1);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y1 + cornerLen);
      ctx.moveTo(x2, y1);
      ctx.lineTo(x2 - cornerLen, y1);
      ctx.moveTo(x2, y1);
      ctx.lineTo(x2, y1 + cornerLen);
      ctx.moveTo(x1, y2);
      ctx.lineTo(x1 + cornerLen, y2);
      ctx.moveTo(x1, y2);
      ctx.lineTo(x1, y2 - cornerLen);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - cornerLen, y2);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2, y2 - cornerLen);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const label = `${obj.class.toUpperCase()} ${(obj.confidence * 100).toFixed(0)}%`;
      ctx.font = "600 13px 'Inter', sans-serif";
      const metrics = ctx.measureText(label);
      const labelW = metrics.width + 12;
      const labelH = 22;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x1, y1 - labelH - 4, labelW, labelH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "#020617";
      ctx.fillText(label, x1 + 6, y1 - 9);
    });
  }, [latestDetections, canvasRef]);

  useEffect(() => {
    let animationFrameId: number;
    const renderLoop = () => {
      drawOverlay();
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawOverlay]);

  return (
    <Card className="bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden shadow-xl gap-0 pb-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#1e293b] bg-[#020617]/50 space-y-0">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-medium text-slate-200">
            Live Streaming CCTV — Gerbang 01
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  streamMode === "webrtc" ? "bg-cyan-400" : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  streamMode === "webrtc" ? "bg-cyan-500" : "bg-red-500"
                }`}
              />
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              LIVE
            </span>
          </div>
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <AspectRatio
          ratio={16 / 9}
          className="relative w-full bg-black flex items-center justify-center"
        >
          {streamMode === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
              <p className="text-xs text-slate-400 font-mono animate-pulse">
                MENYIAPKAN WEBRTC...
              </p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-contain object-center ${streamMode === "connecting" ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none"
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <div className="px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
              FPS: 30
            </div>
            <div className="px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
              AI: AKTIF
            </div>
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
