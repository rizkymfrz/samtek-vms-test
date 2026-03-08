import { Car, Truck, Bike, Bus } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VehicleCounterProps {
  counts: {
    mobil: number;
    motor: number;
    truk: number;
    bus: number;
  };
}

export function VehicleCounter({ counts }: VehicleCounterProps) {
  const stats = [
    {
      label: "Mobil",
      value: counts.mobil,
      icon: Car,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      label: "Truk",
      value: counts.truk,
      icon: Truck,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/20",
    },
    {
      label: "Motor",
      value: counts.motor,
      icon: Bike,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    },
    {
      label: "Bus",
      value: counts.bus,
      icon: Bus,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={`bg-[#0f172a]/80 px-4 backdrop-blur-md border ${stat.border} transition-all duration-300 hover:shadow-lg hover:bg-[#1e293b]/80`}
          >
            <CardContent className="p-0 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-slate-700"
                >
                  Hari Ini
                </Badge>
              </div>
              <motion.div
                key={stat.value}
                initial={{ scale: 1.1, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold text-slate-50 tracking-tight"
              >
                {stat.value}
              </motion.div>
              <div className="text-xs font-medium text-slate-400 mt-1">
                {stat.label} Total
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
