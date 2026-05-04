'use client';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export default function AnimatedNumber({ value, suffix = '', prefix = '', duration = 1000 }: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    const safeValue = value ?? 0;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      setDisplay(Math.round(progress * safeValue));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    return () => { startTime.current = null; };
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}
