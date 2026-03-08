import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsChartProps {
  data: { time: string; count: number }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const chartData =
    data.length > 0
      ? data
      : [
          { time: "00:00", count: 0 },
          { time: "00:01", count: 0 },
        ];

  return (
    <Card className="bg-[#0f172a]/80 backdrop-blur-md border-[#1e293b] shadow-xl h-full min-h-[250px] lg:min-h-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#1e293b] bg-[#020617]/50 space-y-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <CardTitle className="text-sm font-medium text-slate-200">
            Analitik
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-2 bg-[#020617]/50 border-slate-700 px-2 py-0.5"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
            REALTIME
          </span>
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#64748b" }}
              stroke="#1e293b"
              tickMargin={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              stroke="#1e293b"
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f8fafc",
                boxShadow:
                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "#06b6d4" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
