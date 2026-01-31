'use client';

interface AddColumnHeaderProps {
  onClick: () => void;
}

export function AddColumnHeader({ onClick }: AddColumnHeaderProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center gap-1 px-4 py-2 bg-clay-50 border-b border-clay-200 cursor-pointer min-w-[100px] hover:bg-clay-100 transition-colors"
    >
      <span className="text-sm text-clay-400">+</span>
      <span className="text-[11px] text-clay-500">Add new...</span>
    </div>
  );
}
