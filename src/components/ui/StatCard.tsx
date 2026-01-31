import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-clay-50 border border-clay-200 rounded-lg px-5 py-4 flex-1 min-w-[140px]',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-clay-500 mb-1">{label}</div>
          <div className="text-2xl font-bold text-clay-900">{value}</div>
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-clay-100 flex items-center justify-center text-base">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
