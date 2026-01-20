import { memo, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import type { StatChartProps } from '@/types/chat';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const StatChart = memo(function StatChart({ data, metric, color = 'hsl(var(--primary))' }: StatChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{metric}</h3>
        <p className="text-sm text-muted-foreground">Trend over time</p>
      </div>

      <Suspense fallback={<div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading chart...</div>}>
        <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </Suspense>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">Average</span>
          <span className="font-semibold">
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
});
