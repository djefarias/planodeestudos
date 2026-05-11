'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanoDiarioContent() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cronograma');
  }, [router]);

  return null;
}
