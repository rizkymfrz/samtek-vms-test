"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { LayoutDashboard, Video, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar({ className }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const formatTime = () =>
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    setCurrentTime(formatTime());
    const interval = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, active: true },
    { name: "Kamera", icon: Video, active: false },
    { name: "Analitik", icon: Activity, active: false },
    { name: "Pengaturan", icon: Settings, active: false },
  ];

  return (
    <aside
      className={`w-64 hidden lg:flex flex-col border-r border-[#1e293b] bg-[#020617]/80 backdrop-blur-xl h-dvh sticky top-0 p-4 ${className || ""}`}
    >
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <Image
          src="/logo.svg"
          alt="SAMTEK Logo"
          width={32}
          height={32}
          className="w-8 h-8 object-contain"
        />
        <div>
          <h1 className="text-lg font-bold text-slate-50 tracking-tight leading-tight">
            SAMTEK
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            Platform VMS
          </p>
        </div>
      </div>
      <Separator className="bg-slate-800 mb-6" />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-2 pr-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full justify-start gap-3 px-4 py-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? "bg-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/20 hover:text-[#06b6d4] border border-[#06b6d4]/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="mt-auto px-4 py-4 rounded-lg bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Sistem Online
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">
          Pembaruan Terakhir: {currentTime || "—"}
        </p>
      </div>
    </aside>
  );
}
