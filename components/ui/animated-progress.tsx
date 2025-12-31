'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export function AnimatedProgress({
  value,
  className,
  indicatorClassName,
}: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref}>
      <ProgressPrimitive.Root
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
          className
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn('h-full w-full flex-1 bg-primary', indicatorClassName)}
          style={{
            transform: `translateX(-${100 - (animatedValue || 0)}%)`,
            transition: 'transform 1s cubic-bezier(0.65, 0, 0.35, 1)',
          }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
