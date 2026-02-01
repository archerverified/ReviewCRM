'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  trailColor?: string;
  trailSize?: number;
  disabled?: boolean;
}

export function HoverCard({
  children,
  className,
  trailColor = 'bg-gradient-to-l from-amber-300 via-amber-500 to-amber-300',
  trailSize = 60,
  disabled = false
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all',
        isHovered && !disabled && 'border-amber-400/50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && !disabled && (
        <BorderTrail
          className={trailColor}
          size={trailSize}
        />
      )}
      {children}
    </div>
  );
}
