'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LoadingChart = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
  </div>
);

export const LazyLineChart = dynamic(
  () => import('@/components/charts/line-chart'),
  { ssr: false, loading: LoadingChart }
);

export const LazyBarChart = dynamic(
  () => import('@/components/charts/bar-chart'),
  { ssr: false, loading: LoadingChart }
);

export const LazyPieChart = dynamic(
  () => import('@/components/charts/pie-chart'),
  { ssr: false, loading: LoadingChart }
);
