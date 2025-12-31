'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  locale?: string;
  currency?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  locale = 'vi-VN',
  currency = 'VND',
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;
    const durationMs = duration * 1000;

    // Use steps for smoother visual effect (animate by 100k increments)
    const step = Math.max(100000, Math.abs(endValue) / 20);

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Easing function (ease-out)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOutProgress;

      // Round to nearest step for smoother visual
      const roundedValue = Math.round(currentValue / step) * step;

      setDisplayValue(roundedValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure final value is exact
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  const formattedValue = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(displayValue);

  return (
    <span ref={ref} className={className}>
      {formattedValue}
    </span>
  );
}
