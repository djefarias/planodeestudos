'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function BarChartComponent({ data, dataKey, xKey, colors }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
        <XAxis
          dataKey={xKey ?? 'nome'}
          tickLine={false}
          tick={{ fontSize: 9 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Bar dataKey={dataKey ?? 'horas'} radius={[4, 4, 0, 0]} animationDuration={1000}>
          {(data ?? []).map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry?.cor ?? (colors ?? ['#6366f1'])[index % (colors?.length ?? 1)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
