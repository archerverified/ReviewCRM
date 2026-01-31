import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-status-green-bg text-status-green-text',
  blue: 'bg-status-blue-bg text-status-blue-text',
  yellow: 'bg-status-yellow-bg text-status-yellow-text',
  red: 'bg-status-red-bg text-status-red-text',
  gray: 'bg-status-gray-bg text-status-gray-text',
  purple: 'bg-status-purple-bg text-status-purple-text',
  orange: 'bg-status-orange-bg text-status-orange-text',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
