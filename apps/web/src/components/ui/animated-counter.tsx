'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.3,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      if (spanRef.current) {
        spanRef.current.textContent = `${prefix}${value}${suffix}`;
      }
      return;
    }

    // Extract numeric portion if string like "4.2 min" or "486"
    const strVal = String(value);
    const numericPart = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;
    const hasDecimal = strVal.includes('.') || decimals > 0;
    const inferredDecimals = decimals > 0 ? decimals : hasDecimal ? 1 : 0;

    // Detect trailing text like " min" if not supplied in suffix
    let effectiveSuffix = suffix;
    if (!suffix && /[a-zA-Z%]/.test(strVal)) {
      const match = strVal.match(/[a-zA-Z%].*$/);
      if (match) {
        effectiveSuffix = ` ${match[0]}`.replace('  ', ' ');
      }
    }

    const counterObj = { current: 0 };

    const ctx = gsap.context(() => {
      gsap.to(counterObj, {
        current: numericPart,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (spanRef.current) {
            const formatted =
              inferredDecimals > 0
                ? counterObj.current.toFixed(inferredDecimals)
                : Math.round(counterObj.current).toLocaleString();
            spanRef.current.textContent = `${prefix}${formatted}${effectiveSuffix}`;
          }
        },
      });
    }, spanRef);

    return () => ctx.revert();
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

