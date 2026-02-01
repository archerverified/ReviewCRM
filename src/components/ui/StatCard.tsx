'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { BorderTrail } from '@/components/motion-primitives/border-trail';
import { AnimatedNumber } from '@/components/motion-primitives/animated-number';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
  highlight?: boolean;
  animate?: boolean;
  hoverTrail?: boolean;
}

export function StatCard({ label, value, icon, className, highlight = false, animate = false, hoverTrail = true }: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';

  const showTrail = hoverTrail ? isHovered : highlight;

  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded-lg px-5 py-4 flex-1 min-w-[140px] overflow-hidden transition-all',
        isHovered && 'border-amber-400/50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showTrail && (
        <BorderTrail
          className="bg-gradient-to-l from-amber-300 via-amber-500 to-amber-300"
          size={60}
        />
      )}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{label}</div>
          <div className="text-2xl font-bold text-foreground">
            {animate && isNumeric ? (
              <AnimatedNumber
                value={numericValue}
                springOptions={{ bounce: 0, duration: 1000 }}
              />
            ) : (
              value
            )}
          </div>
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
