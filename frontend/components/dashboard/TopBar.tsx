import { Camera, Server, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  connected: boolean;
  streamMode: "webrtc" | "mp4" | "connecting";
  className?: string;
}

export function TopBar({ connected, streamMode, className }: TopBarProps) {
  return (
    <header
      className={`h-16 flex items-center justify-between px-4 lg:px-6 border-b border-[#1e293b] bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50 ${className || ""}`}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-400 hover:text-slate-100"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h2 className="text-sm font-medium text-slate-300 hidden sm:block">
          Ringkasan / <span className="text-slate-50">Analitik Langsung</span>
        </h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Camera className="w-4 h-4" />
            <span>Kamera Aktif: 1</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-800" />
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <Badge
              variant={connected ? "default" : "destructive"}
              className={`${
                connected
                  ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  : ""
              } font-mono`}
            >
              {connected ? "SERVER AI ONLINE" : "SERVER AI OFFLINE"}
            </Badge>
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-800" />
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                streamMode === "webrtc"
                  ? "bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]"
                  : "bg-red-500"
              }`}
            />
            <Badge
              variant={streamMode === "webrtc" ? "default" : "destructive"}
              className={`${
                streamMode === "webrtc"
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : ""
              } font-mono`}
            >
              {streamMode === "webrtc" ? "STREAMING" : "TERPUTUS"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-cyan-400"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 border border-[#020617]" />
        </Button>
        <Avatar className="w-8 h-8 rounded-full border border-slate-700">
          <AvatarFallback className="bg-slate-800 text-xs font-bold text-slate-300">
            RM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
