import { AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CrossingEvent {
  id: string;
  vehicle: string;
  confidence: number;
  timestamp: string;
  is_special_event: boolean;
  image?: string;
}
interface EventFeedProps {
  events: CrossingEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  return (
    <Card className="flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#1e293b] bg-[#020617]/50 space-y-0">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-medium text-slate-200">
            Deteksi Terbaru
          </h3>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] text-slate-400 font-mono bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          {events.length} log
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <ScrollArea className="absolute inset-0 h-full w-full">
          <div className="flex flex-col gap-3 px-4 h-full">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                <Clock className="w-8 h-8 opacity-20" />
                <p className="text-xs font-mono text-center">
                  Menunggu aktivitas kendaraan...
                </p>
              </div>
            ) : (
              events.map((evt) => {
                const isSpecial = evt.is_special_event;
                const timeStr = new Date(evt.timestamp).toLocaleTimeString(
                  "id-ID",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  },
                );
                return (
                  <div
                    key={evt.id}
                    className={`flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                      isSpecial
                        ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
                        : "bg-[#1e293b]/50 border-[#1e293b] hover:bg-[#1e293b] hover:border-[#334155]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSpecial ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        )}
                        <span
                          className={`font-semibold text-sm uppercase tracking-wide ${
                            isSpecial ? "text-red-400" : "text-slate-200"
                          }`}
                        >
                          {evt.vehicle}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-slate-400 font-mono bg-[#020617]/50 border-slate-700 px-2 py-0.5"
                      >
                        {timeStr}
                      </Badge>
                    </div>
                    {evt.image && (
                      <div className="mb-2 w-full h-32 rounded bg-slate-800/50 overflow-hidden relative border border-[#1e293b]">
                        <img
                          src={evt.image}
                          alt="Snapshot crossing"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Akurasi:</span>
                        <span className="text-xs font-mono text-cyan-400 font-medium">
                          {(evt.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {isSpecial && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-mono bg-red-400/10 text-red-400 border-red-400/30 hover:bg-red-400/20"
                        >
                          DITANDAI
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
