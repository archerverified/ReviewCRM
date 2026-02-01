'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui';
import {
  LayoutDashboard,
  Users,
  Layers,
  Target,
  BarChart3,
  Mail,
  Sparkles,
  CheckSquare,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
  { href: '/contacts', label: 'Contacts', icon: Users, section: 'MAIN' },
  { href: '/pipeline', label: 'Pipeline', icon: Layers, section: 'MAIN' },
  { href: '/campaigns', label: 'Campaigns', icon: Target, section: 'MAIN' },
  { href: '/email-accounts', label: 'Email Accounts', icon: Mail, section: 'MAIN' },
  { href: '/metrics', label: 'Metrics', icon: BarChart3, section: 'ANALYTICS' },
  { href: '/ai-tools', label: 'AI Tools', icon: Sparkles, section: 'TOOLS' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, section: 'TOOLS' },
];

const sections = ['MAIN', 'ANALYTICS', 'TOOLS'] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-clay-200 z-50 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-clay-100">
        <Link href="/" className="text-lg font-bold text-clay-800">
          ReviewCRM
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {sections.map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-6">
              <div className="text-[11px] font-normal text-clay-400 uppercase tracking-wider px-3 mb-2">
                {section}
              </div>
              {sectionItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                      transition-all duration-100
                      ${
                        isActive
                          ? 'bg-clay-100 text-clay-900'
                          : 'text-clay-600 hover:bg-clay-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-clay-200">
        <div className="flex items-center gap-3">
          <Avatar name="John Doe" size="md" />
          <div>
            <div className="text-sm font-medium text-clay-800">John Doe</div>
            <div className="text-[11px] text-clay-500">Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
