'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Target,
  BarChart3,
  Mail,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    href: '/contacts',
    label: 'Contacts',
    icon: Users,
    section: 'main',
  },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: Layers,
    section: 'main',
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: Target,
    section: 'main',
  },
  {
    href: '/metrics',
    label: 'Metrics',
    icon: BarChart3,
    section: 'analytics',
  },
  {
    href: '/email-accounts',
    label: 'Email Accounts',
    icon: Mail,
    section: 'tools',
  },
  {
    href: '/ai-tools',
    label: 'AI Tools',
    icon: Sparkles,
    section: 'tools',
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: CheckSquare,
    section: 'tools',
  },
  {
    href: '/verify-emails',
    label: 'Verify Emails',
    icon: ShieldCheck,
    section: 'tools',
  },
];

const sections = {
  main: { label: 'Main', items: navItems.filter(i => i.section === 'main') },
  analytics: { label: 'Analytics', items: navItems.filter(i => i.section === 'analytics') },
  tools: { label: 'Tools', items: navItems.filter(i => i.section === 'tools') },
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-700 group-hover:to-purple-700">
            ReviewCRM
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {Object.entries(sections).map(([key, section]) => (
          <div key={key}>
            {/* Section Label */}
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            </div>

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 group
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <span
                      className={`
                        transition-all duration-200
                        ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </span>

                    {/* Label */}
                    <span className="flex-1">{item.label}</span>

                    {/* Optional badge */}
                    {item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105">
              2I
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              2ndimpression.co
            </p>
            <p className="text-xs text-gray-500 truncate">
              Reputation Management
            </p>
          </div>

          {/* Settings Icon */}
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
