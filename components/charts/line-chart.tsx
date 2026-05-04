'use client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function LineChartComponent({ data, dataKey, xKey, color, name }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
        <XAxis
          dataKey={xKey ?? 'data'}
          tickLine={false}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          tick={{ fontSize: 10 }}
          label={{ value: 'Min', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
        />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey={dataKey ?? 'minutos'}
          stroke={color ?? '#6366f1'}
          strokeWidth={2}
          dot={{ r: 3, fill: color ?? '#6366f1' }}
          name={name ?? 'Minutos'}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
