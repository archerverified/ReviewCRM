'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Business, Campaign, Task } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { HoverCard } from '@/components/ui/HoverCard';
import { TextShimmer } from '@/components/motion-primitives';

// Icons as inline SVGs for crisp rendering
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13L2 6" />
  </svg>
);

const StarMinusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const TaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10M11 9h7M11 13h4" />
    <path d="M3 17l3 3 3-3M6 18V4" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

interface DashboardStats {
  reviewsRemoved: number;
  totalContacts: number;
  emailsSent: number;
  activeTasks: number;
  emailOpenRate: number;
}

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  color: 'pink' | 'green' | 'blue' | 'orange';
}

interface MonthlyData {
  month: string;
  value: number;
}

// Sample agenda data
const sampleAgenda: AgendaItem[] = [
  { id: '1', time: '7:00 AM', title: 'Follow up with lead', color: 'pink' },
  { id: '2', time: '7:00 AM', title: 'test', color: 'green' },
];

// Monthly chart data
const monthlyChartData: MonthlyData[] = [
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 52 },
  { month: 'Mar', value: 38 },
  { month: 'Apr', value: 65 },
  { month: 'May', value: 48 },
  { month: 'Jun', value: 72 },
  { month: 'Jul', value: 64 },
  { month: 'Aug', value: 58 },
  { month: 'Sep', value: 70 },
  { month: 'Oct', value: 55 },
  { month: 'Nov', value: 62 },
  { month: 'Dec', value: 48 },
];

// Category colors for donut chart (darkest to lightest grayscale)
const categoryColors = {
  Agency: '#171717',        // clay-900
  Marketing: '#525252',     // clay-600
  'Web Development': '#a3a3a3', // clay-400
  Travel: '#d4d4d4',        // clay-300
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    reviewsRemoved: 0,
    totalContacts: 0,
    emailsSent: 0,
    activeTasks: 0,
    emailOpenRate: 64.23,
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [companiesSearch, setCompaniesSearch] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    try {
      const [businessesRes, campaignsRes, tasksRes] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('campaigns').select('*'),
        supabase.from('tasks').select('*').eq('status', 'todo').order('created_at', { ascending: false }),
      ]);

      const businessData = (businessesRes.data || []) as Business[];
      const campaignData = (campaignsRes.data || []) as Campaign[];
      const taskData = (tasksRes.data || []) as Task[];

      const emailsSent = campaignData.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
      const emailsOpened = campaignData.reduce((sum, c) => sum + (c.emails_opened || 0), 0);
      const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 64.23;

      // Calculate total reviews removed (sum of media reviews across all businesses)
      const reviewsRemoved = businessData.reduce((sum, b) => sum + (b.total_media_reviews || 0), 0);

      setStats({
        reviewsRemoved,
        totalContacts: businessData.length,
        emailsSent,
        activeTasks: taskData.length,
        emailOpenRate: Math.round(openRate * 100) / 100,
      });

      setBusinesses(businessData);
      setTasks(taskData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter businesses for People table
  const filteredPeople = useMemo(() => {
    return businesses
      .filter(b => b.contact_name || b.first_name || b.last_name)
      .filter(b => {
        if (!peopleSearch) return true;
        const search = peopleSearch.toLowerCase();
        return (
          b.contact_name?.toLowerCase().includes(search) ||
          b.first_name?.toLowerCase().includes(search) ||
          b.last_name?.toLowerCase().includes(search) ||
          b.email?.toLowerCase().includes(search) ||
          b.business_name?.toLowerCase().includes(search)
        );
      })
      .slice(0, 5);
  }, [businesses, peopleSearch]);

  // Filter businesses for Companies table
  const filteredCompanies = useMemo(() => {
    return businesses
      .filter(b => b.business_name)
      .filter(b => {
        if (!companiesSearch) return true;
        const search = companiesSearch.toLowerCase();
        return (
          b.business_name?.toLowerCase().includes(search) ||
          b.industry?.toLowerCase().includes(search) ||
          b.city?.toLowerCase().includes(search)
        );
      })
      .slice(0, 5);
  }, [businesses, companiesSearch]);

  // Category distribution for donut chart
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Agency: 0,
      Marketing: 0,
      'Web Development': 0,
      Travel: 0,
    };

    businesses.forEach(b => {
      const industry = b.industry?.toLowerCase() || '';
      if (industry.includes('agency')) counts.Agency++;
      else if (industry.includes('marketing')) counts.Marketing++;
      else if (industry.includes('web') || industry.includes('dev')) counts['Web Development']++;
      else if (industry.includes('travel') || industry.includes('hotel')) counts.Travel++;
      else counts.Agency++; // Default
    });

    return counts;
  }, [businesses]);

  const totalCategories = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string | null) => {
    if (!name) return 'bg-clay-400';
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Agenda tag colors
  const tagColors = {
    pink: 'bg-pink-100 text-pink-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TextShimmer className="text-xl font-semibold" duration={1.5}>Loading Dashboard...</TextShimmer>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-clay-100 border border-clay-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-clay-100 border border-clay-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-clay-100 border border-clay-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-clay-900">Dashboard</h1>

      {/* Stats Row - Using motion-primitives enhanced StatCard */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<MailIcon />}
          label="Email Sent"
          value={stats.emailsSent}
          animate
        />
        <StatCard
          icon={<StarMinusIcon />}
          label="Reviews Removed"
          value={stats.reviewsRemoved}
          highlight
          animate
        />
        <StatCard
          icon={<UsersIcon />}
          label="Total Contact"
          value={stats.totalContacts}
          animate
        />
        <StatCard
          icon={<TaskIcon />}
          label="Ongoing Task"
          value={stats.activeTasks}
          animate
        />
      </div>

      {/* Agenda & Chart Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Upcoming Agenda */}
        <HoverCard className="bg-white border border-clay-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-clay-900 mb-4">Upcoming Agenda</h2>
          <div className="space-y-2.5">
            {(tasks.length > 0 ? tasks.slice(0, 4).map((task, i) => ({
              id: task.id,
              time: task.due_date ? new Date(task.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—',
              title: task.title,
              color: (['pink', 'green', 'blue', 'orange'] as const)[i % 4],
            })) : sampleAgenda).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className={`text-[11px] font-medium px-2 py-1 rounded ${tagColors[item.color]} whitespace-nowrap`}>
                  {item.time}
                </span>
                <span className="text-sm text-clay-700 pt-0.5">{item.title}</span>
              </div>
            ))}
          </div>
        </HoverCard>

        {/* Average Email Open Rate */}
        <HoverCard className="bg-white border border-clay-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-clay-900 mb-0.5">Average Email Open Rate</h2>
              <p className="text-[11px] text-clay-400">Average Open Rate</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-clay-500">
              <span>Jan, 2023 - December, 2023</span>
              <select className="bg-clay-50 border border-clay-200 rounded px-2 py-1 text-[11px] text-clay-600 focus:outline-none">
                <option>Month</option>
              </select>
            </div>
          </div>
          <div className="text-3xl font-bold text-clay-900 mb-3">{stats.emailOpenRate}%</div>

          {/* Bar Chart */}
          <div className="relative flex items-end justify-between h-40 gap-1.5 px-1">
            {monthlyChartData.map((data, i) => {
              const isHighlighted = data.month === 'Sep';
              const barHeight = Math.max((data.value / 100) * 100, 20); // Scale to 100% max, minimum 20% visibility
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex justify-center h-36">
                    {isHighlighted && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-clay-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        {stats.emailOpenRate}%
                      </div>
                    )}
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        className={`w-full max-w-[20px] rounded-t-sm transition-all ${
                          isHighlighted ? 'bg-clay-900' : 'bg-clay-200'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-clay-500">{data.month}</span>
                </div>
              );
            })}
          </div>
        </HoverCard>
      </div>

      {/* People Table */}
      <HoverCard className="bg-white border border-clay-200 rounded-xl">
        <div className="p-4 border-b border-clay-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-clay-900">People</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm bg-clay-50 border border-clay-200 rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-clay-300"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-clay-400 pointer-events-none">
                  <SearchIcon />
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100">
                <SortIcon /> Sort by
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100">
                <FilterIcon /> Filter
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-clay-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[180px]">Name ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[200px]">Email ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[140px]">Phone ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[140px]">Company ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[140px]">Location ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 min-w-[100px]">Action</th>
              </tr>
            </thead>
          <tbody>
            {filteredPeople.length > 0 ? filteredPeople.map((person) => {
              const name = person.contact_name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown';
              return (
                <tr key={person.id} className="border-b border-clay-50 hover:bg-clay-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(name)}`}>
                        {getInitials(name)}
                      </div>
                      <span className="text-sm text-clay-800">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-clay-600">{person.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-clay-600">{person.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                      {person.business_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-clay-600">
                    {person.city || '—'}{person.state ? `, ${person.state}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-clay-400 hover:text-clay-600 hover:bg-clay-100 rounded">
                        <ListIcon />
                      </button>
                      <Link href={`/businesses/${person.id}`} className="p-1.5 text-clay-400 hover:text-clay-600 hover:bg-clay-100 rounded">
                        <EditIcon />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-clay-400">
                  No contacts found. Import data to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </HoverCard>

      {/* Companies & Categories Row */}
      <div className="grid grid-cols-5 gap-5">
        {/* Companies Table */}
        <HoverCard className="col-span-3 bg-white border border-clay-200 rounded-xl">
          <div className="p-4 border-b border-clay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-clay-900">Companies</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={companiesSearch}
                    onChange={(e) => setCompaniesSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-clay-50 border border-clay-200 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-clay-300"
                  />
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-clay-400 pointer-events-none">
                    <SearchIcon />
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100">
                  <SortIcon /> Sort by
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100">
                  <FilterIcon /> Filter
                </button>
              </div>
            </div>
          </div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-clay-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-clay-500 w-[35%]">Company Name ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 w-[25%]">Industry ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 w-[25%]">Location ↕</th>
                <th className="px-4 py-3 text-xs font-medium text-clay-500 w-[15%]">Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? filteredCompanies.map((company) => {
                const stage = company.pipeline_stage || 'lead_scraped';
                const isActive = ['positive_reply', 'qualified_lead', 'in_negotiation', 'deal_closed'].includes(stage);
                return (
                  <tr key={company.id} className="border-b border-clay-50 hover:bg-clay-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${getAvatarColor(company.business_name)}`}>
                          {getInitials(company.business_name)}
                        </div>
                        <span className="text-sm text-clay-800 truncate">{company.business_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-clay-600 truncate">{company.industry || 'General'}</td>
                    <td className="px-4 py-3 text-sm text-clay-600 truncate">
                      {company.city || '—'}{company.state ? `, ${company.state}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        isActive ? 'bg-green-50 text-green-700' : 'bg-clay-100 text-clay-600'
                      }`}>
                        {isActive ? 'Active' : 'Lead'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-clay-400">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </HoverCard>

        {/* Company Categories Donut */}
        <HoverCard className="col-span-2 bg-white border border-clay-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-clay-900 mb-4">Company Categories</h2>

          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const total = totalCategories || 1;
                  let cumulative = 0;
                  const entries = Object.entries(categoryDistribution);

                  return entries.map(([category, count], i) => {
                    const percentage = (count / total) * 100;
                    const dashArray = `${percentage * 2.51} ${251 - percentage * 2.51}`;
                    const dashOffset = -cumulative * 2.51;
                    cumulative += percentage;

                    return (
                      <circle
                        key={category}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={Object.values(categoryColors)[i]}
                        strokeWidth="16"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-clay-900">{totalCategories || businesses.length}</span>
                <span className="text-[10px] text-clay-500">Companies</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {Object.entries(categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                  />
                  <span className="text-sm text-clay-600">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </HoverCard>
      </div>
    </div>
  );
}
